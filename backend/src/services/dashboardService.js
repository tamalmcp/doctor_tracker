const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const { Patient } = require('../models/Patient');
const User = require('../models/User');
const Role = require('../models/Role');
const { resolveDataAccessScope, hasPermission } = require('./rbacService');

function buildDateWindow(query = {}) {
  const days = Math.min(90, Math.max(7, parseInt(query.days, 10) || 14));
  const end = query.endDate ? new Date(query.endDate) : new Date();
  end.setUTCHours(23, 59, 59, 999);

  const start = query.startDate ? new Date(query.startDate) : new Date(end);
  if (!query.startDate) {
    start.setUTCDate(start.getUTCDate() - (days - 1));
  }
  start.setUTCHours(0, 0, 0, 0);

  return { start, end };
}

function generateDateBuckets(start, end) {
  const buckets = [];
  const cursor = new Date(start);
  while (cursor <= end && buckets.length < 120) {
    buckets.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return buckets;
}

async function getDashboardAnalytics(query = {}, authContext) {
  const scope = await resolveDataAccessScope(authContext);
  const { start, end } = buildDateWindow(query);

  const canViewDoctors = hasPermission(authContext, 'doctors.view');
  const canViewPatients = hasPermission(authContext, 'patients.view');
  const canViewUsers = hasPermission(authContext, 'users.view');
  const canViewRoles = hasPermission(authContext, 'roles.view');

  const doctorMatch = {};
  const patientMatch = {};

  if (scope.level === 'doctor') {
    const docId = scope.doctorId
      ? new mongoose.Types.ObjectId(scope.doctorId)
      : new mongoose.Types.ObjectId();
    doctorMatch._id = docId;
    patientMatch.doctor = docId;
  } else if (scope.level === 'patient') {
    const patientObjectIds = (scope.patientIds || []).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const doctorObjectIds = (scope.doctorIds || []).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    patientMatch._id = { $in: patientObjectIds };
    doctorMatch._id = { $in: doctorObjectIds };
  } else if (scope.level === 'none') {
    doctorMatch._id = { $in: [] };
    patientMatch._id = { $in: [] };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const [
    totalDoctors,
    recentDoctorsCount,
    patientSummaryFacet,
    patientsPerDoctorAgg,
    patientsByConditionAgg,
    patientsByStatusAgg,
    doctorTrendAgg,
    patientTrendAgg,
    recentDoctors,
    recentPatients,
    totalUsers,
    totalRoles,
  ] = await Promise.all([
    canViewDoctors ? Doctor.countDocuments(doctorMatch) : 0,
    canViewDoctors
      ? Doctor.countDocuments({ ...doctorMatch, createdAt: { $gte: thirtyDaysAgo } })
      : 0,
    canViewPatients
      ? Patient.aggregate([
          { $match: patientMatch },
          {
            $facet: {
              total: [{ $count: 'count' }],
              unassigned: [
                { $match: { doctor: null } },
                { $count: 'count' },
              ],
              recent: [
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $count: 'count' },
              ],
              critical: [
                { $match: { status: 'Critical' } },
                { $count: 'count' },
              ],
            },
          },
        ])
      : Promise.resolve([{}]),
    canViewDoctors && canViewPatients
      ? Patient.aggregate([
          { $match: { ...patientMatch, doctor: { $ne: null } } },
          {
            $group: {
              _id: '$doctor',
              patientCount: { $sum: 1 },
            },
          },
          { $sort: { patientCount: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'doctors',
              localField: '_id',
              foreignField: '_id',
              as: 'doctor',
            },
          },
          { $unwind: '$doctor' },
          {
            $project: {
              _id: 0,
              doctorId: '$doctor._id',
              name: '$doctor.name',
              specialization: '$doctor.specialization',
              hospital: '$doctor.hospital',
              patientCount: 1,
            },
          },
        ])
      : Promise.resolve([]),
    canViewPatients
      ? Patient.aggregate([
          { $match: patientMatch },
          {
            $group: {
              _id: '$condition',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 8 },
          {
            $project: {
              _id: 0,
              condition: '$_id',
              count: 1,
            },
          },
        ])
      : Promise.resolve([]),
    canViewPatients
      ? Patient.aggregate([
          { $match: patientMatch },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          {
            $project: {
              _id: 0,
              status: '$_id',
              count: 1,
            },
          },
        ])
      : Promise.resolve([]),
    canViewDoctors
      ? Doctor.aggregate([
          {
            $match: {
              ...doctorMatch,
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
        ])
      : Promise.resolve([]),
    canViewPatients
      ? Patient.aggregate([
          {
            $match: {
              ...patientMatch,
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
        ])
      : Promise.resolve([]),
    canViewDoctors
      ? Doctor.find(doctorMatch)
          .select('name specialization hospital email createdAt')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
      : Promise.resolve([]),
    canViewPatients
      ? Patient.find(patientMatch)
          .select('name age condition status admissionDate doctor createdAt')
          .populate('doctor', 'name specialization')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
      : Promise.resolve([]),
    canViewUsers ? User.countDocuments() : Promise.resolve(null),
    canViewRoles ? Role.countDocuments() : Promise.resolve(null),
  ]);

  const facet = patientSummaryFacet[0] || {};
  const totalPatients = facet.total?.[0]?.count || 0;
  const unassignedPatients = facet.unassigned?.[0]?.count || 0;
  const recentPatientsCount = facet.recent?.[0]?.count || 0;
  const criticalPatientsCount = facet.critical?.[0]?.count || 0;

  const doctorDateMap = new Map(
    doctorTrendAgg.map((item) => [item._id, item.count])
  );
  const patientDateMap = new Map(
    patientTrendAgg.map((item) => [item._id, item.count])
  );

  const dateBuckets = generateDateBuckets(start, end);
  const dateTrends = dateBuckets.map((dateStr) => ({
    date: dateStr,
    doctors: doctorDateMap.get(dateStr) || 0,
    patients: patientDateMap.get(dateStr) || 0,
  }));

  return {
    scope: scope.level,
    permissions: {
      canViewDoctors,
      canViewPatients,
      canViewUsers,
      canViewRoles,
    },
    summary: {
      totalDoctors: canViewDoctors ? totalDoctors : null,
      recentDoctorsCount: canViewDoctors ? recentDoctorsCount : null,
      totalPatients: canViewPatients ? totalPatients : null,
      recentPatientsCount: canViewPatients ? recentPatientsCount : null,
      unassignedPatients: canViewPatients ? unassignedPatients : null,
      criticalPatientsCount: canViewPatients ? criticalPatientsCount : null,
      avgPatientsPerDoctor:
        canViewDoctors && canViewPatients && totalDoctors > 0
          ? Number((totalPatients / totalDoctors).toFixed(1))
          : 0,
      totalUsers,
      totalRoles,
    },
    charts: {
      patientsPerDoctor: patientsPerDoctorAgg,
      patientsByCondition: patientsByConditionAgg,
      patientsByStatus: patientsByStatusAgg,
      dateTrends,
    },
    recent: {
      doctors: recentDoctors,
      patients: recentPatients,
    },
  };
}

module.exports = {
  getDashboardAnalytics,
};

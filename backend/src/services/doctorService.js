const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const { Patient } = require('../models/Patient');
const ApiError = require('../utils/ApiError');
const { resolveDataAccessScope, hasPermission } = require('./rbacService');
const {
  escapeRegex,
  buildPagination,
  buildPaginationMeta,
  buildDateRangeFilter,
} = require('../utils/queryHelpers');

async function assertDoctorAccess(doctorId, authContext) {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw ApiError.badRequest('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(doctorId).lean();
  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }

  const scope = await resolveDataAccessScope(authContext);
  if (scope.level === 'none') {
    throw ApiError.forbidden('You do not have access to doctor records');
  }
  if (
    scope.level === 'doctor' &&
    (!scope.doctorId || String(scope.doctorId) !== String(doctor._id))
  ) {
    throw ApiError.forbidden('You can only access your own doctor profile');
  }
  if (
    scope.level === 'patient' &&
    !scope.doctorIds.some((id) => String(id) === String(doctor._id))
  ) {
    throw ApiError.forbidden('You can only view your assigned doctor');
  }

  return { doctor, scope };
}

async function listDoctors(query = {}, authContext) {
  const { page, limit, skip } = buildPagination(query);
  const scope = await resolveDataAccessScope(authContext);

  if (scope.level === 'none') {
    return {
      doctors: [],
      filters: { specializations: [], hospitals: [] },
      meta: buildPaginationMeta({ page, limit, total: 0 }),
    };
  }

  const match = {};

  if (scope.level === 'doctor') {
    if (!scope.doctorId) {
      return {
        doctors: [],
        filters: { specializations: [], hospitals: [] },
        meta: buildPaginationMeta({ page, limit, total: 0 }),
      };
    }
    match._id = new mongoose.Types.ObjectId(scope.doctorId);
  } else if (scope.level === 'patient') {
    if (!scope.doctorIds || scope.doctorIds.length === 0) {
      return {
        doctors: [],
        filters: { specializations: [], hospitals: [] },
        meta: buildPaginationMeta({ page, limit, total: 0 }),
      };
    }
    match._id = {
      $in: scope.doctorIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    match.$or = [
      { name: regex },
      { specialization: regex },
      { hospital: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  if (query.specialization) {
    match.specialization = new RegExp(
      `^${escapeRegex(query.specialization.trim())}$`,
      'i'
    );
  }

  if (query.hospital) {
    match.hospital = new RegExp(`^${escapeRegex(query.hospital.trim())}$`, 'i');
  }

  const dateFilter = buildDateRangeFilter(query.startDate, query.endDate);
  if (dateFilter) {
    match.createdAt = dateFilter;
  }

  const allowedSortFields = ['createdAt', 'name', 'specialization', 'hospital'];
  const sortField = allowedSortFields.includes(query.sortBy)
    ? query.sortBy
    : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const [aggResult, specializations, hospitals] = await Promise.all([
    Doctor.aggregate([
      { $match: match },
      { $sort: { [sortField]: sortOrder } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'patients',
                localField: '_id',
                foreignField: 'doctor',
                as: '_patients',
              },
            },
            {
              $addFields: {
                patientCount: { $size: '$_patients' },
              },
            },
            {
              $project: {
                _patients: 0,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]),
    Doctor.distinct('specialization'),
    Doctor.distinct('hospital'),
  ]);

  const doctors = aggResult[0]?.items || [];
  const total = aggResult[0]?.totalCount?.[0]?.count || 0;

  return {
    doctors,
    filters: {
      specializations: specializations.filter(Boolean).sort(),
      hospitals: hospitals.filter(Boolean).sort(),
    },
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

async function getDoctorById(doctorId, authContext) {
  const { doctor } = await assertDoctorAccess(doctorId, authContext);
  const patientCount = await Patient.countDocuments({ doctor: doctor._id });
  return {
    ...doctor,
    patientCount,
  };
}

async function createDoctor(payload, authContext) {
  const existing = await Doctor.findOne({ email: payload.email }).lean();
  if (existing) {
    throw ApiError.conflict('A doctor with this email already exists');
  }

  const doctor = await Doctor.create({
    name: payload.name,
    specialization: payload.specialization,
    hospital: payload.hospital,
    phone: payload.phone,
    email: payload.email,
    user: payload.user || null,
    createdBy: authContext.user._id,
  });

  return {
    ...doctor.toObject(),
    patientCount: 0,
  };
}

async function updateDoctor(doctorId, payload, authContext) {
  const { doctor } = await assertDoctorAccess(doctorId, authContext);

  if (payload.email && payload.email !== doctor.email) {
    const duplicate = await Doctor.findOne({
      email: payload.email,
      _id: { $ne: doctor._id },
    }).lean();
    if (duplicate) {
      throw ApiError.conflict('A doctor with this email already exists');
    }
  }

  const updateData = { ...payload };
  if ('user' in updateData && !updateData.user) {
    updateData.user = null;
  }

  const updated = await Doctor.findByIdAndUpdate(
    doctor._id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  const patientCount = await Patient.countDocuments({ doctor: doctor._id });

  return {
    ...updated,
    patientCount,
  };
}

async function deleteDoctor(doctorId, authContext) {
  const { doctor } = await assertDoctorAccess(doctorId, authContext);

  await Patient.updateMany(
    { doctor: doctor._id },
    { $set: { doctor: null } }
  );

  await Doctor.deleteOne({ _id: doctor._id });
  return { id: String(doctor._id) };
}

async function getDoctorPatients(doctorId, query = {}, authContext) {
  const { doctor, scope } = await assertDoctorAccess(doctorId, authContext);
  const { page, limit, skip } = buildPagination(query);

  const filter = { doctor: doctor._id };

  if (scope.level === 'patient') {
    filter._id = { $in: scope.patientIds };
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [
      { name: regex },
      { condition: regex },
      { phone: regex },
      { email: regex },
    ];
  }

  if (query.condition) {
    filter.condition = new RegExp(`^${escapeRegex(query.condition.trim())}$`, 'i');
  }

  if (query.status) {
    filter.status = query.status;
  }

  const dateFilter = buildDateRangeFilter(query.startDate, query.endDate);
  if (dateFilter) {
    filter.admissionDate = dateFilter;
  }

  const [patients, total] = await Promise.all([
    Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Patient.countDocuments(filter),
  ]);

  return {
    doctor,
    patients,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

async function addPatientToDoctor(doctorId, payload, authContext) {
  const { doctor } = await assertDoctorAccess(doctorId, authContext);

  if (payload.patientId) {
    const canAssignExisting =
      hasPermission(authContext, 'patients.update') ||
      hasPermission(authContext, 'doctors.update');
    if (!canAssignExisting) {
      throw ApiError.forbidden(
        'Missing permission to assign existing patient to doctor'
      );
    }

    const patient = await Patient.findById(payload.patientId);
    if (!patient) {
      throw ApiError.notFound('Patient not found');
    }

    patient.doctor = doctor._id;
    await patient.save();
    return { patient: patient.toObject(), created: false };
  }

  const canCreateUnderDoctor =
    hasPermission(authContext, 'patients.create') ||
    hasPermission(authContext, 'doctors.update');
  if (!canCreateUnderDoctor) {
    throw ApiError.forbidden(
      'Missing permission to add a new patient under this doctor'
    );
  }

  const patient = await Patient.create({
    name: payload.name,
    age: payload.age,
    gender: payload.gender,
    phone: payload.phone,
    email: payload.email || '',
    condition: payload.condition,
    status: payload.status || 'Active',
    admissionDate: payload.admissionDate ? new Date(payload.admissionDate) : new Date(),
    notes: payload.notes || '',
    doctor: doctor._id,
    createdBy: authContext.user._id,
  });

  return { patient: patient.toObject(), created: true };
}

async function removePatientFromDoctor(
  doctorId,
  patientId,
  authContext,
  mode = 'unassign'
) {
  const { doctor } = await assertDoctorAccess(doctorId, authContext);

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw ApiError.badRequest('Invalid patient ID');
  }

  const patient = await Patient.findOne({
    _id: patientId,
    doctor: doctor._id,
  });

  if (!patient) {
    throw ApiError.notFound('Patient is not assigned to this doctor');
  }

  if (mode === 'delete') {
    if (!hasPermission(authContext, 'patients.delete')) {
      throw ApiError.forbidden('Missing required permission: patients.delete');
    }
    await Patient.deleteOne({ _id: patient._id });
    return { id: String(patient._id), mode: 'deleted' };
  }

  patient.doctor = null;
  await patient.save();
  return { id: String(patient._id), mode: 'unassigned' };
}

module.exports = {
  listDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  addPatientToDoctor,
  removePatientFromDoctor,
};

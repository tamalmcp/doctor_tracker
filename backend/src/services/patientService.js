const mongoose = require('mongoose');
const { Patient } = require('../models/Patient');
const Doctor = require('../models/Doctor');
const ApiError = require('../utils/ApiError');
const { resolveDataAccessScope } = require('./rbacService');
const {
  escapeRegex,
  buildPagination,
  buildPaginationMeta,
  buildDateRangeFilter,
} = require('../utils/queryHelpers');

async function assertPatientAccess(patientId, authContext) {
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw ApiError.badRequest('Invalid patient ID');
  }

  const patient = await Patient.findById(patientId)
    .populate('doctor', 'name specialization hospital phone email')
    .lean();

  if (!patient) {
    throw ApiError.notFound('Patient not found');
  }

  const scope = await resolveDataAccessScope(authContext);
  if (scope.level === 'none') {
    throw ApiError.forbidden('You do not have access to patient records');
  }

  if (scope.level === 'doctor') {
    const assignedDoctorId = patient.doctor ? String(patient.doctor._id) : null;
    if (!scope.doctorId || assignedDoctorId !== String(scope.doctorId)) {
      throw ApiError.forbidden(
        'You can only access patients assigned to you'
      );
    }
  } else if (scope.level === 'patient') {
    const allowed = scope.patientIds.some(
      (id) => String(id) === String(patient._id)
    );
    if (!allowed) {
      throw ApiError.forbidden('You can only access your own patient record');
    }
  }

  return { patient, scope };
}

async function listPatients(query = {}, authContext) {
  const { page, limit, skip } = buildPagination(query);
  const scope = await resolveDataAccessScope(authContext);

  if (scope.level === 'none') {
    return {
      patients: [],
      filters: { conditions: [] },
      meta: buildPaginationMeta({ page, limit, total: 0 }),
    };
  }

  const filter = {};

  if (scope.level === 'doctor') {
    if (!scope.doctorId) {
      return {
        patients: [],
        filters: { conditions: [] },
        meta: buildPaginationMeta({ page, limit, total: 0 }),
      };
    }
    filter.doctor = scope.doctorId;
  } else if (scope.level === 'patient') {
    if (!scope.patientIds || scope.patientIds.length === 0) {
      return {
        patients: [],
        filters: { conditions: [] },
        meta: buildPaginationMeta({ page, limit, total: 0 }),
      };
    }
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

  if (query.gender) {
    filter.gender = query.gender;
  }

  if (query.doctorId && scope.level === 'all') {
    if (query.doctorId === 'unassigned') {
      filter.doctor = null;
    } else if (mongoose.Types.ObjectId.isValid(query.doctorId)) {
      filter.doctor = query.doctorId;
    }
  }

  const dateFilter = buildDateRangeFilter(query.startDate, query.endDate);
  if (dateFilter) {
    const targetDateField =
      query.dateField === 'createdAt' ? 'createdAt' : 'admissionDate';
    filter[targetDateField] = dateFilter;
  }

  const allowedSortFields = ['createdAt', 'admissionDate', 'name', 'age', 'condition'];
  const sortField = allowedSortFields.includes(query.sortBy)
    ? query.sortBy
    : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const conditionScopeFilter =
    scope.level === 'doctor'
      ? { doctor: scope.doctorId }
      : scope.level === 'patient'
      ? { _id: { $in: scope.patientIds } }
      : {};

  const [patients, total, conditions] = await Promise.all([
    Patient.find(filter)
      .populate('doctor', 'name specialization hospital')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
    Patient.distinct('condition', conditionScopeFilter),
  ]);

  return {
    patients,
    filters: {
      conditions: conditions.filter(Boolean).sort(),
    },
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

async function getPatientById(patientId, authContext) {
  const { patient } = await assertPatientAccess(patientId, authContext);
  return patient;
}

async function createPatient(payload, authContext) {
  const scope = await resolveDataAccessScope(authContext);
  if (scope.level === 'none' || scope.level === 'patient') {
    throw ApiError.forbidden('You do not have permission to create patient records');
  }

  let assignedDoctorId = payload.doctor || null;

  if (scope.level === 'doctor') {
    if (!scope.doctorId) {
      throw ApiError.badRequest(
        'No linked doctor profile found for your user account'
      );
    }
    if (
      assignedDoctorId &&
      String(assignedDoctorId) !== String(scope.doctorId)
    ) {
      throw ApiError.forbidden(
        'Doctors can only create patients assigned to themselves'
      );
    }
    assignedDoctorId = scope.doctorId;
  }

  if (assignedDoctorId) {
    const doctorExists = await Doctor.exists({ _id: assignedDoctorId });
    if (!doctorExists) {
      throw ApiError.notFound('Assigned doctor not found');
    }
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
    doctor: assignedDoctorId,
    user: payload.user || null,
    createdBy: authContext.user._id,
  });

  return Patient.findById(patient._id)
    .populate('doctor', 'name specialization hospital')
    .lean();
}

async function updatePatient(patientId, payload, authContext) {
  const { patient, scope } = await assertPatientAccess(patientId, authContext);

  const updateData = { ...payload };

  if (scope.level === 'doctor') {
    if (
      'doctor' in updateData &&
      updateData.doctor &&
      String(updateData.doctor) !== String(scope.doctorId)
    ) {
      throw ApiError.forbidden(
        'Doctors cannot reassign patients to another doctor'
      );
    }
  } else if (scope.level === 'patient') {
    if ('doctor' in updateData) {
      throw ApiError.forbidden(
        'Patients cannot reassign their own doctor'
      );
    }
  }

  if ('doctor' in updateData) {
    if (!updateData.doctor) {
      updateData.doctor = null;
    } else {
      const doctorExists = await Doctor.exists({ _id: updateData.doctor });
      if (!doctorExists) {
        throw ApiError.notFound('Assigned doctor not found');
      }
    }
  }

  if ('user' in updateData && !updateData.user) {
    updateData.user = null;
  }

  if (updateData.admissionDate) {
    updateData.admissionDate = new Date(updateData.admissionDate);
  }

  const updated = await Patient.findByIdAndUpdate(
    patient._id,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('doctor', 'name specialization hospital')
    .lean();

  return updated;
}

async function assignDoctor(patientId, doctorId, authContext) {
  const { patient, scope } = await assertPatientAccess(patientId, authContext);

  if (scope.level === 'doctor' || scope.level === 'patient') {
    throw ApiError.forbidden(
      'Only administrators can reassign patients between doctors'
    );
  }

  let resolvedDoctorId = null;
  if (doctorId) {
    const doctorExists = await Doctor.exists({ _id: doctorId });
    if (!doctorExists) {
      throw ApiError.notFound('Target doctor not found');
    }
    resolvedDoctorId = doctorId;
  }

  const updated = await Patient.findByIdAndUpdate(
    patient._id,
    { $set: { doctor: resolvedDoctorId } },
    { new: true }
  )
    .populate('doctor', 'name specialization hospital')
    .lean();

  return updated;
}

async function deletePatient(patientId, authContext) {
  const { patient } = await assertPatientAccess(patientId, authContext);
  await Patient.deleteOne({ _id: patient._id });
  return { id: String(patient._id) };
}

module.exports = {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient,
  assignDoctor,
  deletePatient,
};

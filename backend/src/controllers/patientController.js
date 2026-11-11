const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const patientService = require('../services/patientService');

const listPatients = asyncHandler(async (req, res) => {
  const { patients, filters, meta } = await patientService.listPatients(
    req.query,
    req.auth
  );
  return ApiResponse.success(res, {
    message: 'Patients retrieved successfully',
    data: patients,
    meta: { ...meta, filters },
  });
});

const getPatientById = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientById(req.params.id, req.auth);
  return ApiResponse.success(res, {
    message: 'Patient retrieved successfully',
    data: patient,
  });
});

const createPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.createPatient(req.body, req.auth);
  return ApiResponse.created(res, {
    message: 'Patient created successfully',
    data: patient,
  });
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatient(
    req.params.id,
    req.body,
    req.auth
  );
  return ApiResponse.success(res, {
    message: 'Patient updated successfully',
    data: patient,
  });
});

const assignDoctor = asyncHandler(async (req, res) => {
  const patient = await patientService.assignDoctor(
    req.params.id,
    req.body.doctorId,
    req.auth
  );
  return ApiResponse.success(res, {
    message: 'Patient doctor assignment updated',
    data: patient,
  });
});

const deletePatient = asyncHandler(async (req, res) => {
  const result = await patientService.deletePatient(req.params.id, req.auth);
  return ApiResponse.success(res, {
    message: 'Patient deleted successfully',
    data: result,
  });
});

module.exports = {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient,
  assignDoctor,
  deletePatient,
};

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const doctorService = require('../services/doctorService');

const listDoctors = asyncHandler(async (req, res) => {
  const { doctors, filters, meta } = await doctorService.listDoctors(
    req.query,
    req.auth
  );
  return ApiResponse.success(res, {
    message: 'Doctors retrieved successfully',
    data: doctors,
    meta: { ...meta, filters },
  });
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await doctorService.getDoctorById(req.params.id, req.auth);
  return ApiResponse.success(res, {
    message: 'Doctor retrieved successfully',
    data: doctor,
  });
});

const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.createDoctor(req.body, req.auth);
  return ApiResponse.created(res, {
    message: 'Doctor created successfully',
    data: doctor,
  });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.updateDoctor(
    req.params.id,
    req.body,
    req.auth
  );
  return ApiResponse.success(res, {
    message: 'Doctor updated successfully',
    data: doctor,
  });
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const result = await doctorService.deleteDoctor(req.params.id, req.auth);
  return ApiResponse.success(res, {
    message: 'Doctor deleted successfully',
    data: result,
  });
});

const getDoctorPatients = asyncHandler(async (req, res) => {
  const { doctor, patients, meta } = await doctorService.getDoctorPatients(
    req.params.id,
    req.query,
    req.auth
  );
  return ApiResponse.success(res, {
    message: 'Doctor patients retrieved successfully',
    data: { doctor, patients },
    meta,
  });
});

const addPatientToDoctor = asyncHandler(async (req, res) => {
  const { patient, created } = await doctorService.addPatientToDoctor(
    req.params.id,
    req.body,
    req.auth
  );
  return ApiResponse.success(res, {
    statusCode: created ? 201 : 200,
    message: created
      ? 'Patient created and assigned to doctor'
      : 'Existing patient assigned to doctor',
    data: patient,
  });
});

const removePatientFromDoctor = asyncHandler(async (req, res) => {
  const mode = req.query.mode === 'delete' ? 'delete' : 'unassign';
  const result = await doctorService.removePatientFromDoctor(
    req.params.id,
    req.params.patientId,
    req.auth,
    mode
  );
  return ApiResponse.success(res, {
    message:
      mode === 'delete'
        ? 'Patient deleted from doctor patient list'
        : 'Patient removed from doctor patient list',
    data: result,
  });
});

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

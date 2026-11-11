const express = require('express');
const doctorController = require('../../controllers/doctorController');
const { requireAuth } = require('../../middlewares/authMiddleware');
const {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
} = require('../../middlewares/rbacMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const {
  createDoctorSchema,
  updateDoctorSchema,
  addPatientToDoctorSchema,
} = require('../../validators/doctorValidator');

const router = express.Router();

router.use(requireAuth);

router.get(
  '/',
  requirePermission('doctors.view'),
  doctorController.listDoctors
);
router.get(
  '/:id',
  requirePermission('doctors.view'),
  doctorController.getDoctorById
);
router.post(
  '/',
  requirePermission('doctors.create'),
  validate(createDoctorSchema),
  doctorController.createDoctor
);
router.put(
  '/:id',
  requirePermission('doctors.update'),
  validate(updateDoctorSchema),
  doctorController.updateDoctor
);
router.delete(
  '/:id',
  requirePermission('doctors.delete'),
  doctorController.deleteDoctor
);

router.get(
  '/:id/patients',
  requireAllPermissions(['doctors.view', 'patients.view']),
  doctorController.getDoctorPatients
);
router.post(
  '/:id/patients',
  requireAnyPermission(['patients.create', 'patients.update', 'doctors.update']),
  validate(addPatientToDoctorSchema),
  doctorController.addPatientToDoctor
);
router.delete(
  '/:id/patients/:patientId',
  requireAnyPermission(['doctors.update', 'patients.update', 'patients.delete']),
  doctorController.removePatientFromDoctor
);

module.exports = router;

const express = require('express');
const patientController = require('../../controllers/patientController');
const { requireAuth } = require('../../middlewares/authMiddleware');
const { requirePermission } = require('../../middlewares/rbacMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const {
  createPatientSchema,
  updatePatientSchema,
  assignDoctorSchema,
} = require('../../validators/patientValidator');

const router = express.Router();

router.use(requireAuth);

router.get(
  '/',
  requirePermission('patients.view'),
  patientController.listPatients
);
router.get(
  '/:id',
  requirePermission('patients.view'),
  patientController.getPatientById
);
router.post(
  '/',
  requirePermission('patients.create'),
  validate(createPatientSchema),
  patientController.createPatient
);
router.put(
  '/:id',
  requirePermission('patients.update'),
  validate(updatePatientSchema),
  patientController.updatePatient
);
router.patch(
  '/:id/assign-doctor',
  requirePermission('patients.update'),
  validate(assignDoctorSchema),
  patientController.assignDoctor
);
router.delete(
  '/:id',
  requirePermission('patients.delete'),
  patientController.deletePatient
);

module.exports = router;

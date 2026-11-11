const { z } = require('zod');
const { PATIENT_GENDERS, PATIENT_STATUSES } = require('../models/Patient');

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const createDoctorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Doctor name must be at least 2 characters')
    .max(120, 'Doctor name cannot exceed 120 characters'),
  specialization: z
    .string()
    .trim()
    .min(2, 'Specialization is required')
    .max(120, 'Specialization cannot exceed 120 characters'),
  hospital: z
    .string()
    .trim()
    .min(2, 'Hospital name is required')
    .max(150, 'Hospital name cannot exceed 150 characters'),
  phone: z
    .string()
    .trim()
    .min(5, 'Phone number is required')
    .max(30, 'Phone number cannot exceed 30 characters'),
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  user: z.union([objectIdSchema, z.literal(''), z.null()]).optional(),
});

const updateDoctorSchema = createDoctorSchema.partial();

const addPatientToDoctorSchema = z.union([
  z.object({
    patientId: objectIdSchema,
  }),
  z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Patient name must be at least 2 characters')
      .max(120),
    age: z.coerce.number().min(0, 'Age cannot be negative').max(150, 'Age cannot exceed 150'),
    gender: z.enum(PATIENT_GENDERS),
    phone: z.string().trim().min(5, 'Phone number is required').max(30),
    email: z
      .union([z.literal(''), z.string().trim().email('Invalid email').toLowerCase()])
      .optional()
      .default(''),
    condition: z.string().trim().min(2, 'Condition is required').max(150),
    status: z.enum(PATIENT_STATUSES).optional().default('Active'),
    admissionDate: z.string().optional(),
    notes: z.string().trim().max(1000).optional().default(''),
  }),
]);

module.exports = {
  createDoctorSchema,
  updateDoctorSchema,
  addPatientToDoctorSchema,
};

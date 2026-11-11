const { z } = require('zod');
const { PATIENT_GENDERS, PATIENT_STATUSES } = require('../models/Patient');

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const createPatientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Patient name must be at least 2 characters')
    .max(120, 'Patient name cannot exceed 120 characters'),
  age: z.coerce
    .number({ invalid_type_error: 'Age must be a valid number' })
    .min(0, 'Age cannot be negative')
    .max(150, 'Age cannot exceed 150'),
  gender: z.enum(PATIENT_GENDERS, {
    errorMap: () => ({ message: 'Gender must be Male, Female, or Other' }),
  }),
  phone: z
    .string()
    .trim()
    .min(5, 'Phone number is required')
    .max(30, 'Phone number cannot exceed 30 characters'),
  email: z
    .union([z.literal(''), z.string().trim().email('Please provide a valid email').toLowerCase()])
    .optional()
    .default(''),
  condition: z
    .string()
    .trim()
    .min(2, 'Medical condition is required')
    .max(150, 'Condition cannot exceed 150 characters'),
  status: z.enum(PATIENT_STATUSES).optional().default('Active'),
  admissionDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional().default(''),
  doctor: z.union([objectIdSchema, z.literal(''), z.null()]).optional(),
  user: z.union([objectIdSchema, z.literal(''), z.null()]).optional(),
});

const updatePatientSchema = createPatientSchema.partial();

const assignDoctorSchema = z.object({
  doctorId: z.union([objectIdSchema, z.literal(''), z.null()]),
});

module.exports = {
  createPatientSchema,
  updatePatientSchema,
  assignDoctorSchema,
};

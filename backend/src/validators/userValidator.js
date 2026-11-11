const { z } = require('zod');

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password cannot exceed 128 characters'),
  roles: z
    .array(objectIdSchema)
    .min(1, 'At least one role must be assigned'),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase()
    .optional(),
  password: z
    .union([
      z.literal(''),
      z.string().min(6, 'Password must be at least 6 characters').max(128),
    ])
    .optional(),
  roles: z
    .array(objectIdSchema)
    .min(1, 'At least one role must be assigned')
    .optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};

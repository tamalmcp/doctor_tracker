const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(128, 'Password cannot exceed 128 characters'),
});

module.exports = {
  loginSchema,
  changePasswordSchema,
};

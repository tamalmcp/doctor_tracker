const { z } = require('zod');

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Role name must be at least 2 characters')
    .max(60, 'Role name cannot exceed 60 characters'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase kebab-case (e.g., clinic-manager)'
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(300, 'Description cannot exceed 300 characters')
    .optional()
    .default(''),
  permissions: z.array(objectIdSchema).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

const updateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Role name must be at least 2 characters')
    .max(60, 'Role name cannot exceed 60 characters')
    .optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase kebab-case'
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(300, 'Description cannot exceed 300 characters')
    .optional(),
  permissions: z.array(objectIdSchema).optional(),
  isActive: z.boolean().optional(),
});

const assignPermissionsSchema = z.object({
  permissionIds: z.array(objectIdSchema),
});

const createPermissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Permission name must be at least 2 characters')
    .max(100, 'Permission name cannot exceed 100 characters'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9_]+(\.[a-z0-9_]+)+$/,
      'Slug must use module.action format (e.g., reports.export)'
    ),
  module: z
    .string()
    .trim()
    .min(2, 'Module name is required')
    .max(60, 'Module name cannot exceed 60 characters'),
  description: z
    .string()
    .trim()
    .max(300, 'Description cannot exceed 300 characters')
    .optional()
    .default(''),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
  createPermissionSchema,
};

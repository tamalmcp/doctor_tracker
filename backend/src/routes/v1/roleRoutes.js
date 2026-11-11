const express = require('express');
const roleController = require('../../controllers/roleController');
const { requireAuth } = require('../../middlewares/authMiddleware');
const {
  requirePermission,
  requireRole,
} = require('../../middlewares/rbacMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { SYSTEM_ROLE_SLUGS } = require('../../constants/roles');
const {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
} = require('../../validators/roleValidator');

const router = express.Router();

// Only Super Admin can manage roles and permissions
router.use(requireAuth, requireRole(SYSTEM_ROLE_SLUGS.SUPER_ADMIN));

router.get('/', requirePermission('roles.view'), roleController.listRoles);
router.get('/:id', requirePermission('roles.view'), roleController.getRoleById);
router.post(
  '/',
  requirePermission('roles.create'),
  validate(createRoleSchema),
  roleController.createRole
);
router.put(
  '/:id',
  requirePermission('roles.update'),
  validate(updateRoleSchema),
  roleController.updateRole
);
router.patch(
  '/:id/activate',
  requirePermission('roles.activate'),
  roleController.activateRole
);
router.patch(
  '/:id/deactivate',
  requirePermission('roles.deactivate'),
  roleController.deactivateRole
);
router.put(
  '/:id/permissions',
  requirePermission('roles.assign_permissions'),
  validate(assignPermissionsSchema),
  roleController.assignPermissions
);
router.get(
  '/:id/users',
  requirePermission('roles.view_assigned_users'),
  roleController.getRoleAssignedUsers
);
router.delete(
  '/:id',
  requirePermission('roles.delete'),
  roleController.deleteRole
);

module.exports = router;

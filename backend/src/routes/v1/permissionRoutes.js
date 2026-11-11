const express = require('express');
const permissionController = require('../../controllers/permissionController');
const { requireAuth } = require('../../middlewares/authMiddleware');
const {
  requirePermission,
  requireRole,
} = require('../../middlewares/rbacMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { SYSTEM_ROLE_SLUGS } = require('../../constants/roles');
const { createPermissionSchema } = require('../../validators/roleValidator');

const router = express.Router();

// Only Super Admin can manage roles and permissions
router.use(requireAuth, requireRole(SYSTEM_ROLE_SLUGS.SUPER_ADMIN));

router.get(
  '/',
  requirePermission('roles.assign_permissions'),
  permissionController.listPermissions
);
router.post(
  '/',
  requirePermission('roles.assign_permissions'),
  validate(createPermissionSchema),
  permissionController.createPermission
);

module.exports = router;

const express = require('express');
const userController = require('../../controllers/userController');
const { requireAuth } = require('../../middlewares/authMiddleware');
const {
  requirePermission,
  requireAnyPermission,
} = require('../../middlewares/rbacMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const {
  createUserSchema,
  updateUserSchema,
} = require('../../validators/userValidator');

const router = express.Router();

router.use(requireAuth);

router.get(
  '/assignable-roles',
  requireAnyPermission(['users.create', 'users.update', 'users.view']),
  userController.getAssignableRoles
);

router.get('/', requirePermission('users.view'), userController.listUsers);
router.get('/:id', requirePermission('users.view'), userController.getUserById);
router.post(
  '/',
  requirePermission('users.create'),
  validate(createUserSchema),
  userController.createUser
);
router.put(
  '/:id',
  requirePermission('users.update'),
  validate(updateUserSchema),
  userController.updateUser
);
router.delete(
  '/:id',
  requirePermission('users.delete'),
  userController.deleteUser
);

module.exports = router;

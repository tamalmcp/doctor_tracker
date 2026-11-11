const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const roleService = require('../services/roleService');

const listRoles = asyncHandler(async (req, res) => {
  const { roles, meta } = await roleService.listRoles(req.query);
  return ApiResponse.success(res, {
    message: 'Roles retrieved successfully',
    data: roles,
    meta,
  });
});

const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  return ApiResponse.success(res, {
    message: 'Role details retrieved successfully',
    data: role,
  });
});

const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(req.body);
  return ApiResponse.created(res, {
    message: 'Role created successfully',
    data: role,
  });
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  return ApiResponse.success(res, {
    message: 'Role updated successfully',
    data: role,
  });
});

const activateRole = asyncHandler(async (req, res) => {
  const role = await roleService.setRoleActiveStatus(req.params.id, true);
  return ApiResponse.success(res, {
    message: 'Role activated successfully',
    data: role,
  });
});

const deactivateRole = asyncHandler(async (req, res) => {
  const role = await roleService.setRoleActiveStatus(req.params.id, false);
  return ApiResponse.success(res, {
    message: 'Role deactivated successfully',
    data: role,
  });
});

const assignPermissions = asyncHandler(async (req, res) => {
  const role = await roleService.assignPermissionsToRole(
    req.params.id,
    req.body.permissionIds
  );
  return ApiResponse.success(res, {
    message: 'Role permissions updated successfully',
    data: role,
  });
});

const deleteRole = asyncHandler(async (req, res) => {
  const result = await roleService.deleteRole(req.params.id);
  return ApiResponse.success(res, {
    message: 'Role deleted successfully',
    data: result,
  });
});

const getRoleAssignedUsers = asyncHandler(async (req, res) => {
  const { role, users, meta } = await roleService.getRoleAssignedUsers(
    req.params.id,
    req.query
  );
  return ApiResponse.success(res, {
    message: 'Assigned users retrieved successfully',
    data: { role, users },
    meta,
  });
});

module.exports = {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  activateRole,
  deactivateRole,
  assignPermissions,
  deleteRole,
  getRoleAssignedUsers,
};

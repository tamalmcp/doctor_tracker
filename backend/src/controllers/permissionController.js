const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const permissionService = require('../services/permissionService');

const listPermissions = asyncHandler(async (req, res) => {
  const result = await permissionService.listPermissions(req.query);
  return ApiResponse.success(res, {
    message: 'Permissions retrieved successfully',
    data: result,
  });
});

const createPermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.createPermission(req.body);
  return ApiResponse.created(res, {
    message: 'Permission created successfully',
    data: permission,
  });
});

module.exports = {
  listPermissions,
  createPermission,
};

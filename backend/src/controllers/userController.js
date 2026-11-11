const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const userService = require('../services/userService');

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.listUsers(req.query);
  return ApiResponse.success(res, {
    message: 'Users retrieved successfully',
    data: users,
    meta,
  });
});

const getAssignableRoles = asyncHandler(async (req, res) => {
  const roles = await userService.getAssignableRoles(req.auth);
  return ApiResponse.success(res, {
    message: 'Assignable roles retrieved successfully',
    data: roles,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ApiResponse.success(res, {
    message: 'User retrieved successfully',
    data: user,
  });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, req.auth);
  return ApiResponse.created(res, {
    message: 'User created successfully',
    data: user,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.auth);
  return ApiResponse.success(res, {
    message: 'User updated successfully',
    data: user,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id, req.auth);
  return ApiResponse.success(res, {
    message: 'User deleted successfully',
    data: result,
  });
});

module.exports = {
  listUsers,
  getAssignableRoles,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

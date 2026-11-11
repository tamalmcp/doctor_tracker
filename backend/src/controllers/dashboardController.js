const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const dashboardService = require('../services/dashboardService');

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const analytics = await dashboardService.getDashboardAnalytics(
    req.query,
    req.auth
  );
  return ApiResponse.success(res, {
    message: 'Dashboard analytics retrieved successfully',
    data: analytics,
  });
});

module.exports = {
  getDashboardAnalytics,
};

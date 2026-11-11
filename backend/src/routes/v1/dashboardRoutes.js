const express = require('express');
const dashboardController = require('../../controllers/dashboardController');
const { requireAuth } = require('../../middlewares/authMiddleware');
const { requirePermission } = require('../../middlewares/rbacMiddleware');

const router = express.Router();

router.get(
  '/',
  requireAuth,
  requirePermission('dashboard.view'),
  dashboardController.getDashboardAnalytics
);

module.exports = router;

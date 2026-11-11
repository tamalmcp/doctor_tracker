const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../../controllers/authController');
const { requireAuth } = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const {
  loginSchema,
  changePasswordSchema,
} = require('../../validators/authValidator');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', requireAuth, authController.me);
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;

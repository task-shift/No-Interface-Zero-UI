const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireVerifiedUser } = require('../middleware/auth');
const emailController = require('../controllers/emailController');
const verificationController = require('../controllers/verificationController');
const { authLimiter, emailLimiter } = require('../middleware/rateLimiter');

// Public routes with auth rate limiting
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Verification routes with email rate limiting
router.post('/send-verification', emailLimiter, emailController.sendVerificationEmail);
router.post('/verify-email', emailLimiter, verificationController.verifyEmail);
router.get('/verification-status', verificationController.checkVerificationStatus);

// Protected routes - require authentication but not verification
router.post('/logout', requireAuth, authController.logout);

// Protected routes - require both authentication and verification
router.get('/me', requireVerifiedUser, authController.getCurrentUser);

module.exports = router; 
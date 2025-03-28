const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireVerifiedUser } = require('../middleware/auth');
const emailController = require('../controllers/emailController');
const verificationController = require('../controllers/verificationController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Verification routes
router.post('/send-verification', emailController.sendVerificationEmail);
router.post('/verify-email', verificationController.verifyEmail);
router.get('/verification-status', verificationController.checkVerificationStatus);

// Protected routes - require authentication but not verification
router.post('/logout', requireAuth, authController.logout);

// Protected routes - require both authentication and verification
router.get('/me', requireVerifiedUser, authController.getCurrentUser);

module.exports = router; 
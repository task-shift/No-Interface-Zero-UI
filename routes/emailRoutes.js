const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const verificationController = require('../controllers/verificationController');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { emailLimiter } = require('../middleware/rateLimiter');

// Email verification endpoints
router.post('/send-verification', emailLimiter, emailController.sendVerificationEmail);
router.post('/resend-verification', emailLimiter, emailController.sendVerificationEmail); // Reuse the same controller
router.post('/check-verification', verificationController.checkVerificationStatus);

// Test email endpoint (admin only)
router.post('/test', requireAuth, requireAdmin, emailController.sendTestEmail);

module.exports = router; 
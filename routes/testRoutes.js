const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Email testing endpoints
router.post('/emails', emailController.sendTestEmail);
router.post('/verification-email', emailController.sendVerificationEmail);

// You can add more test endpoints here

module.exports = router; 
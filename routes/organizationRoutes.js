const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { requireVerifiedUser } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// All organization routes require authentication and email verification
router.use(requireVerifiedUser);

// Create a new organization
router.post('/', organizationController.createOrganization);

// Get user's organization details
router.get('/me', organizationController.getOrganization);

// List all organizations (admin only)
router.get('/', requireAdmin, organizationController.listOrganizations);

module.exports = router; 
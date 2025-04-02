const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { requireVerifiedUser } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// All organization routes require authentication and email verification
router.use(requireVerifiedUser);

// Create a new organization
router.post('/', organizationController.createOrganization);

// Get all organizations the user belongs to
router.get('/my-organizations', organizationController.getUserOrganizations);

// Get user's primary organization details (backward compatibility)
router.get('/me', organizationController.getOrganization);

// Invite team member to the user's current organization
router.post('/invite', organizationController.inviteTeamMember);

// Get a specific organization by ID
router.get('/:organization_id', organizationController.getOrganization);

// Join an organization
router.post('/join', organizationController.joinOrganization);

// Leave an organization
router.delete('/:organization_id/leave', organizationController.leaveOrganization);

// Set current organization
router.post('/set-current', organizationController.setCurrentOrganization);

// List all organizations (admin only)
router.get('/', requireAdmin, organizationController.listOrganizations);

module.exports = router; 
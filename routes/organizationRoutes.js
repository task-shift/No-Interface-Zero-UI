const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { requireVerifiedUser, requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// All organization routes require authentication except for invitation activation with registration
router.use(['/activate-invitation-with-registration'], (req, res, next) => {
  next(); // Skip auth for this path
});

// All other organization routes require auth and email verification
router.use((req, res, next) => {
  if (req.path === '/activate-invitation-with-registration') {
    return next();
  }
  requireVerifiedUser(req, res, next);
});

// Create a new organization
router.post('/', organizationController.createOrganization);

// Get all organizations the user belongs to
router.get('/my-organizations', organizationController.getUserOrganizations);

// Get user's primary organization details (backward compatibility)
router.get('/me', organizationController.getOrganization);

// Get all members of the user's current organization
router.get('/members', organizationController.getOrganizationMembers);

// Invite team member to the user's current organization
router.post('/invite', organizationController.inviteTeamMember);

// Activate an invitation to join an organization (requires auth)
router.post('/activate-invitation', organizationController.activateInvitation);

// Activate an invitation with registration (public route)
router.post('/activate-invitation-with-registration', organizationController.activateInvitationWithRegistration);

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
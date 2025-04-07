/**
 * Email templates index file
 * Exports all email templates from a single location
 */

const getVerificationEmailTemplate = require('./verificationEmail');
const getTestEmailTemplate = require('./testEmail');
const getOrganizationInviteTemplate = require('./organizationInviteEmail');

module.exports = {
  getVerificationEmailTemplate,
  getTestEmailTemplate,
  getOrganizationInviteTemplate
}; 
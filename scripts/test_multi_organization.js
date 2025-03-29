/**
 * This script tests the multi-organization functionality
 */

const supabase = require('../config/supabase');
const OrganizationModel = require('../models/organizationModel');
const UserModel = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');

async function testMultiOrganization() {
  console.log('Testing multi-organization functionality...');
  
  try {
    // 1. Create a test user
    const testUserId = uuidv4();
    const testUserEmail = `test.user.${Date.now()}@example.com`;
    
    console.log(`Creating test user with ID: ${testUserId}`);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        fullname: 'Test User',
        username: `testuser_${Date.now()}`,
        email: testUserEmail,
        password: 'password_hash',
        user_id: testUserId,
        role: 'user',
        status: 'verified',
        online: true
      }])
      .select()
      .single();
    
    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }
    
    console.log('Test user created successfully');
    
    // 2. Create multiple organizations for the user
    const orgNames = [
      `Test Organization 1 ${Date.now()}`,
      `Test Organization 2 ${Date.now()}`,
      `Test Organization 3 ${Date.now()}`
    ];
    
    const organizations = [];
    
    for (const orgName of orgNames) {
      console.log(`Creating organization: ${orgName}`);
      
      const { success, organization, error } = await OrganizationModel.createOrganization({
        organization_name: orgName,
        user_id: testUserId
      });
      
      if (!success) {
        throw new Error(`Failed to create organization: ${error}`);
      }
      
      organizations.push(organization);
      console.log(`Organization created: ${organization.organization_id}`);
      
      // Add the user to the organization
      const { success: addSuccess, error: addError } = await UserModel.addUserToOrganization(
        testUserId,
        organization.organization_id
      );
      
      if (!addSuccess) {
        throw new Error(`Failed to add user to organization: ${addError}`);
      }
    }
    
    // 3. Verify that the user belongs to all organizations
    const { success: getSuccess, organizations: userOrgs, error: getError } = 
      await UserModel.getUserOrganizations(testUserId);
    
    if (!getSuccess) {
      throw new Error(`Failed to get user organizations: ${getError}`);
    }
    
    console.log(`User belongs to ${userOrgs.length} organizations`);
    
    if (userOrgs.length !== orgNames.length) {
      throw new Error(`Expected user to belong to ${orgNames.length} organizations, but found ${userOrgs.length}`);
    }
    
    // 4. Remove the user from one organization
    if (organizations.length > 0) {
      const orgToRemove = organizations[0];
      console.log(`Removing user from organization: ${orgToRemove.organization_name}`);
      
      const { success: removeSuccess, error: removeError } = 
        await UserModel.removeUserFromOrganization(
          testUserId,
          orgToRemove.organization_id
        );
      
      if (!removeSuccess) {
        throw new Error(`Failed to remove user from organization: ${removeError}`);
      }
      
      // Verify that the user now belongs to one less organization
      const { success: verifySuccess, organizations: verifyOrgs, error: verifyError } = 
        await UserModel.getUserOrganizations(testUserId);
      
      if (!verifySuccess) {
        throw new Error(`Failed to verify user organizations: ${verifyError}`);
      }
      
      console.log(`After removal, user belongs to ${verifyOrgs.length} organizations`);
      
      if (verifyOrgs.length !== orgNames.length - 1) {
        throw new Error(`Expected user to belong to ${orgNames.length - 1} organizations after removal, but found ${verifyOrgs.length}`);
      }
    }
    
    // 5. Clean up: Delete the test user and organizations
    for (const org of organizations) {
      await supabase
        .from('organizations')
        .delete()
        .eq('organization_id', org.organization_id);
    }
    
    await supabase
      .from('users')
      .delete()
      .eq('user_id', testUserId);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMultiOrganization(); 
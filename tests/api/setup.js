/**
 * API Test Setup Utilities
 * Contains common functions, setup and teardown procedures for API tests
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const supabase = require('../../config/supabase');

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Create a configured axios instance for API requests
const api = axios.create({
  baseURL: API_URL,
  validateStatus: null, // Don't throw on any status code
});

/**
 * Create a test user in the database
 * @param {Object} options - User options
 * @param {string} options.role - User role (default: 'user')
 * @param {string} options.status - User status (default: 'verified')
 * @returns {Promise<Object>} - Created user data and auth token
 */
async function createTestUser(options = {}) {
  const userId = uuidv4();
  const email = `test.user.${Date.now()}@example.com`;
  const username = `testuser_${Date.now()}`;
  const password = 'Password123!';
  
  // Hash the password for direct DB insertion
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Create user directly in database
  const { data: user, error } = await supabase
    .from('users')
    .insert([{
      fullname: 'Test User',
      username,
      email,
      password: hashedPassword,
      user_id: userId,
      role: options.role || 'user',
      status: options.status || 'verified',
      online: true
    }])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }
  
  // Create auth token through API
  let token = null;
  
  try {
    const loginResponse = await api.post('/auth/login', {
      login: email,
      password: password
    });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      token = loginResponse.data.token;
    }
  } catch (err) {
    console.warn('Could not get auth token for test user');
  }
  
  return {
    user,
    token,
    password,
    credentials: { email, password }
  };
}

/**
 * Create a test organization in the database
 * @param {string} userId - User ID who will create the organization
 * @param {string} name - Organization name (optional)
 * @returns {Promise<Object>} - Created organization data
 */
async function createTestOrganization(userId, name = null) {
  const orgName = name || `Test Organization ${Date.now()}`;
  const orgId = uuidv4();
  
  const { data: organization, error } = await supabase
    .from('organizations')
    .insert([{
      organization_name: orgName,
      organization_id: orgId,
      user_id: userId,
      status: 'active'
    }])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test organization: ${error.message}`);
  }
  
  return organization;
}

/**
 * Clean up test data from the database
 * @param {Object} testData - Object containing test data to clean up
 */
async function cleanupTestData(testData = {}) {
  const { users = [], organizations = [] } = testData;
  
  // Delete organizations
  for (const org of organizations) {
    if (org && org.organization_id) {
      await supabase
        .from('organizations')
        .delete()
        .eq('organization_id', org.organization_id);
    }
  }
  
  // Delete users
  for (const user of users) {
    if (user && user.user_id) {
      await supabase
        .from('users')
        .delete()
        .eq('user_id', user.user_id);
    }
  }
}

module.exports = {
  api,
  createTestUser,
  createTestOrganization,
  cleanupTestData
}; 
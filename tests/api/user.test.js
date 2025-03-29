/**
 * User API Tests
 * Tests for user authentication, registration, and profile management
 */

const { api, createTestUser, cleanupTestData } = require('./setup');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../../config/supabase');

// Test data for cleanup
const testData = {
  users: [],
  organizations: []
};

describe('User API', () => {
  // Clean up after all tests are done
  afterAll(async () => {
    await cleanupTestData(testData);
  });

  describe('POST /users/register', () => {
    test('should register a new user successfully', async () => {
      const uniqueEmail = `test_${uuidv4().substring(0, 8)}@example.com`;
      const userData = {
        email: uniqueEmail,
        password: 'Test123!@#',
        username: `testuser_${Date.now()}`,
        role: 'user'
      };

      const response = await api.post('/users/register', userData);
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('registered successfully');
      expect(response.data.user).toBeDefined();
      expect(response.data.user.email).toBe(userData.email);
      expect(response.data.user.username).toBe(userData.username);
      
      // Add user to testData for cleanup
      if (response.data.user) {
        testData.users.push(response.data.user);
      }
    });

    test('should fail to register with invalid data', async () => {
      const response = await api.post('/users/register', {
        email: 'invalid-email',
        password: 'short',
        username: '',
        role: 'user'
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    test('should fail to register with existing email', async () => {
      // Create a user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Try to register with the same email
      const response = await api.post('/users/register', {
        email: testUser.user.email,
        password: 'Test123!@#',
        username: `duplicate_${Date.now()}`,
        role: 'user'
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('already exists');
    });
  });

  describe('POST /users/login', () => {
    test('should login successfully with valid credentials', async () => {
      // Create a user first
      const email = `login_test_${uuidv4().substring(0, 8)}@example.com`;
      const password = 'Test123!@#';
      
      // Register the user directly in the database
      const { data: user, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
      }
      
      // Get the user from the database to add to testData
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (dbUser) {
        testData.users.push(dbUser);
      }
      
      // Verify the email to allow login
      await supabase
        .from('users')
        .update({ status: 'verified' })
        .eq('email', email);
      
      // Now attempt to login
      const response = await api.post('/users/login', {
        email,
        password
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.user).toBeDefined();
      expect(response.data.user.email).toBe(email);
    });

    test('should fail to login with invalid credentials', async () => {
      const response = await api.post('/users/login', {
        email: `invalid_${Date.now()}@example.com`,
        password: 'InvalidPassword123!'
      });
      
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    test('should fail to login with unverified email', async () => {
      // Create a user without verifying
      const email = `unverified_${uuidv4().substring(0, 8)}@example.com`;
      const password = 'Test123!@#';
      
      // Register the user directly in the database
      const { data: user, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
      }
      
      // Get the user from the database to add to testData
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (dbUser) {
        testData.users.push(dbUser);
      }
      
      // Ensure status is not verified (should be the default)
      await supabase
        .from('users')
        .update({ status: 'pending' })
        .eq('email', email);
      
      // Now attempt to login
      const response = await api.post('/users/login', {
        email,
        password
      });
      
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('verify your email');
    });
  });

  describe('GET /users/profile', () => {
    test('should get user profile successfully when authenticated', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.user).toBeDefined();
      expect(response.data.user.email).toBe(testUser.user.email);
      expect(response.data.user.username).toBe(testUser.user.username);
    });

    test('should fail to get profile without authentication', async () => {
      const response = await api.get('/users/profile');
      
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /users/profile', () => {
    test('should update user profile successfully', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const updatedData = {
        username: `updated_username_${Date.now()}`,
        bio: 'This is an updated bio for testing'
      };
      
      const response = await api.put('/users/profile', updatedData, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.user).toBeDefined();
      expect(response.data.user.username).toBe(updatedData.username);
      expect(response.data.user.bio).toBe(updatedData.bio);
    });

    test('should fail to update profile with invalid data', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.put('/users/profile', {
        username: '' // Empty username (invalid)
      }, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /users/verify-email', () => {
    test('should verify email successfully with valid code', async () => {
      // This test is tricky since we need to intercept the email verification code
      // For testing purposes, we'll mock this by directly inserting a verification record
      
      // Create a user with unverified status
      const email = `verification_test_${uuidv4().substring(0, 8)}@example.com`;
      const password = 'Test123!@#';
      
      // Register the user directly in the database
      const { data: authUser, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
      }
      
      // Get the user from the database to add to testData
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (dbUser) {
        testData.users.push(dbUser);
      }
      
      // Create a verification code directly in the database
      const verificationCode = '123456'; // Mock verification code
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour
      
      await supabase
        .from('verification')
        .insert({
          user_id: dbUser.user_id,
          email,
          code: verificationCode,
          expires_at: expiresAt.toISOString(),
          type: 'email_verification'
        });
      
      // Now attempt to verify with this code
      const response = await api.post('/users/verify-email', {
        email,
        code: verificationCode
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the user status was updated
      const { data: updatedUser } = await supabase
        .from('users')
        .select('status')
        .eq('email', email)
        .single();
      
      expect(updatedUser.status).toBe('verified');
    });

    test('should fail to verify email with invalid code', async () => {
      // Create a user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.post('/users/verify-email', {
        email: testUser.user.email,
        code: '999999' // Invalid code
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
}); 
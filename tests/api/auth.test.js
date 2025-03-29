/**
 * Authentication API Tests
 * Tests for authentication-related endpoints
 */

const { api, createTestUser, cleanupTestData } = require('./setup');
const { v4: uuidv4 } = require('uuid');

// Test data for cleanup
const testData = {
  users: []
};

describe('Authentication API', () => {
  
  // Clean up after all tests are done
  afterAll(async () => {
    await cleanupTestData(testData);
  });

  describe('POST /auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        username: `testuser_${Date.now()}`,
        email: `test.register.${Date.now()}@example.com`,
        fullname: 'Test Register User',
        password: 'Password123!'
      };

      const response = await api.post('/auth/register', userData);
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.user).toBeDefined();
      expect(response.data.user.email).toBe(userData.email);
      expect(response.data.user.username).toBe(userData.username);
      
      // Save user for cleanup
      if (response.data.user) {
        testData.users.push(response.data.user);
      }
    });

    test('should fail when registering with an existing email', async () => {
      // First create a user
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Try to register with the same email
      const userData = {
        username: `testuser_duplicate_${Date.now()}`,
        email: testUser.credentials.email,
        fullname: 'Duplicate Email User',
        password: 'Password123!'
      };

      const response = await api.post('/auth/register', userData);
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('email');
    });

    test('should fail when registering with an existing username', async () => {
      // First create a user
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      // Try to register with the same username
      const userData = {
        username: testUser.user.username,
        email: `test.duplicate.username.${Date.now()}@example.com`,
        fullname: 'Duplicate Username User',
        password: 'Password123!'
      };

      const response = await api.post('/auth/register', userData);
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('username');
    });

    test('should fail with invalid input data', async () => {
      const userData = {
        username: 'te', // Too short
        email: 'invalidemail',
        fullname: '',
        password: 'short'
      };

      const response = await api.post('/auth/register', userData);
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    test('should login successfully with email', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const loginData = {
        login: testUser.credentials.email,
        password: testUser.credentials.password
      };

      const response = await api.post('/auth/login', loginData);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.user).toBeDefined();
      expect(response.data.user.email).toBe(testUser.user.email);
    });

    test('should login successfully with username', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const loginData = {
        login: testUser.user.username,
        password: testUser.credentials.password
      };

      const response = await api.post('/auth/login', loginData);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.token).toBeDefined();
    });

    test('should fail with incorrect password', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const loginData = {
        login: testUser.credentials.email,
        password: 'wrong-password'
      };

      const response = await api.post('/auth/login', loginData);
      
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Invalid');
    });

    test('should fail with non-existent user', async () => {
      const loginData = {
        login: `nonexistent_${Date.now()}@example.com`,
        password: 'Password123!'
      };

      const response = await api.post('/auth/login', loginData);
      
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    test('should require verification if user is not verified', async () => {
      // Create an unverified test user
      const testUser = await createTestUser({ status: 'active' });
      testData.users.push(testUser.user);
      
      const loginData = {
        login: testUser.credentials.email,
        password: testUser.credentials.password
      };

      const response = await api.post('/auth/login', loginData);
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.verificationRequired).toBe(true);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout successfully with valid token', async () => {
      // Create a test user first
      const testUser = await createTestUser();
      testData.users.push(testUser.user);
      
      const response = await api.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    test('should fail with invalid token', async () => {
      const response = await api.post('/auth/logout', {}, {
        headers: {
          Authorization: 'Bearer invalid-token'
        }
      });
      
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  describe('Email Verification', () => {
    test('should send verification email', async () => {
      // Create an unverified test user
      const testUser = await createTestUser({ status: 'active' });
      testData.users.push(testUser.user);
      
      const response = await api.post('/auth/send-verification', {
        email: testUser.credentials.email
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('Verification email sent');
    });

    test('should fail to verify with invalid code', async () => {
      // Create an unverified test user
      const testUser = await createTestUser({ status: 'active' });
      testData.users.push(testUser.user);
      
      const response = await api.post('/auth/verify-email', {
        email: testUser.credentials.email,
        verificationCode: '000000'
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    test('should check verification status', async () => {
      // Create a verified test user
      const testUser = await createTestUser({ status: 'verified' });
      testData.users.push(testUser.user);
      
      const response = await api.get(`/auth/verification-status?email=${testUser.credentials.email}`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.verified).toBe(true);
    });
  });
}); 
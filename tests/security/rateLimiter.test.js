/**
 * Rate Limiter Tests
 * 
 * This file contains tests for the rate limiting functionality.
 * These tests verify that rate limiting is correctly applied to different endpoints.
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
const AUTH_LIMIT = 10;  // Auth endpoints limit per hour
const EMAIL_LIMIT = 5;  // Email verification endpoints limit per hour
const API_LIMIT = 100;  // Regular API endpoints limit per 15 min
const GLOBAL_LIMIT = 500; // Global limit per 15 min

/**
 * Tests rate limiting on authentication endpoints
 */
async function testAuthRateLimiting() {
  console.log('\n--- Testing Auth Rate Limiting ---');
  console.log(`Sending ${AUTH_LIMIT + 2} requests to an auth endpoint to test rate limiting...`);
  
  const testData = {
    login: 'testuser',
    password: 'testpassword'
  };

  // Initialize counters
  let successCount = 0;
  let rateLimitedCount = 0;
  let otherErrorCount = 0;
  
  for (let i = 0; i < AUTH_LIMIT + 2; i++) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, testData);
      console.log(`Request ${i+1}: Status ${response.status}`);
      successCount++;
    } catch (error) {
      if (error.response) {
        console.log(`Request ${i+1}: Status ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        
        // Check if we hit the rate limit (429 Too Many Requests)
        if (error.response.status === 429) {
          rateLimitedCount++;
        } else {
          otherErrorCount++;
        }
      } else {
        console.log(`Request ${i+1}: Error - ${error.message}`);
        otherErrorCount++;
      }
    }
    
    // Small delay to make logs readable
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print test results
  console.log('\nAuth Rate Limiting Test Results:');
  console.log(`- Successful requests: ${successCount}`);
  console.log(`- Rate limited requests: ${rateLimitedCount}`);
  console.log(`- Other errors: ${otherErrorCount}`);
  
  if (rateLimitedCount > 0) {
    console.log('✅ Auth rate limiting is working!');
  } else {
    console.log('❌ Auth rate limiting does not appear to be working!');
  }
}

/**
 * Tests rate limiting on email verification endpoints
 */
async function testEmailRateLimiting() {
  console.log('\n--- Testing Email Verification Rate Limiting ---');
  console.log(`Sending ${EMAIL_LIMIT + 2} requests to an email verification endpoint to test rate limiting...`);
  
  const testData = {
    email: 'test@example.com'
  };

  // Initialize counters
  let successCount = 0;
  let rateLimitedCount = 0;
  let otherErrorCount = 0;
  
  for (let i = 0; i < EMAIL_LIMIT + 2; i++) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/send-verification`, testData);
      console.log(`Request ${i+1}: Status ${response.status}`);
      successCount++;
    } catch (error) {
      if (error.response) {
        console.log(`Request ${i+1}: Status ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        
        // Check if we hit the rate limit (429 Too Many Requests)
        if (error.response.status === 429) {
          rateLimitedCount++;
        } else {
          otherErrorCount++;
        }
      } else {
        console.log(`Request ${i+1}: Error - ${error.message}`);
        otherErrorCount++;
      }
    }
    
    // Small delay to make logs readable
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print test results
  console.log('\nEmail Rate Limiting Test Results:');
  console.log(`- Successful requests: ${successCount}`);
  console.log(`- Rate limited requests: ${rateLimitedCount}`);
  console.log(`- Other errors: ${otherErrorCount}`);
  
  if (rateLimitedCount > 0) {
    console.log('✅ Email verification rate limiting is working!');
  } else {
    console.log('❌ Email verification rate limiting does not appear to be working!');
  }
}

/**
 * Run all rate limiting tests
 */
async function runAllTests() {
  console.log('=== Rate Limiting Tests ===');
  console.log('These tests will check if rate limiting is properly implemented.');
  console.log('Note: To reset rate limits, restart your server.\n');
  
  try {
    await testAuthRateLimiting();
    await testEmailRateLimiting();
    // You can add more tests here, e.g., API endpoint rate limiting
  } catch (error) {
    console.error('Error running tests:', error);
  }
  
  console.log('\n=== Rate Limiting Tests Complete ===');
}

// Run the tests if called directly (node rateLimiter.test.js)
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAuthRateLimiting,
  testEmailRateLimiting,
  runAllTests
}; 
/**
 * Body Size Limits Tests
 * 
 * This file contains tests for the request body size limits.
 * These tests verify that requests with large payloads are properly rejected.
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
const LIMIT_SIZE = 1024 * 1024; // 1MB (set in app.js)
const TEST_SIZES = [
  { name: 'Small (10KB)', size: 10 * 1024 },
  { name: 'Medium (500KB)', size: 500 * 1024 },
  { name: 'Near Limit (900KB)', size: 900 * 1024 },
  { name: 'At Limit (1MB)', size: LIMIT_SIZE },
  { name: 'Over Limit (1.5MB)', size: 1.5 * LIMIT_SIZE },
  { name: 'Way Over Limit (3MB)', size: 3 * LIMIT_SIZE }
];

/**
 * Generates a string of a specific size
 */
function generateString(size) {
  // Create a base string (20 bytes)
  const baseString = 'x'.repeat(20);
  
  // Calculate how many repetitions we need
  const repetitions = Math.ceil(size / 20);
  
  // Generate the string and trim to exact size
  return baseString.repeat(repetitions).substring(0, size);
}

/**
 * Tests request body size limits
 */
async function testBodySizeLimits() {
  console.log('\n--- Testing Body Size Limits ---');
  console.log(`Testing requests with different payload sizes (limit: ${LIMIT_SIZE / 1024}KB)...`);
  
  for (const test of TEST_SIZES) {
    console.log(`\nTesting ${test.name} payload...`);
    
    const payload = {
      login: 'testuser',
      password: 'testpassword',
      data: generateString(test.size - 100) // Subtract a bit for the JSON structure
    };
    
    try {
      console.log(`Sending request with payload size: ${JSON.stringify(payload).length} bytes`);
      const response = await axios.post(`${API_URL}/api/auth/login`, payload, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      console.log(`Response Status: ${response.status}`);
      
      if (test.size > LIMIT_SIZE) {
        console.log('❌ Request with payload over the limit was accepted. Body size limiting may not be working correctly.');
      } else {
        console.log('✅ Request accepted (as expected for payload size under the limit).');
      }
    } catch (error) {
      if (error.response) {
        console.log(`Response Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        
        if (test.size > LIMIT_SIZE && (error.response.status === 413 || error.message.includes('entity too large'))) {
          console.log('✅ Large payload correctly rejected.');
        } else if (test.size <= LIMIT_SIZE) {
          console.log('❌ Payload under the limit was rejected. This may indicate a configuration issue.');
        } else {
          console.log('❓ Request failed, but with an unexpected error code. Check server logs for details.');
        }
      } else if (error.request) {
        console.log(`Network error: ${error.message}`);
        
        if (test.size > LIMIT_SIZE && error.message.includes('entity too large')) {
          console.log('✅ Large payload correctly rejected at the network level.');
        } else {
          console.log('❓ Request failed with a network error. This may or may not be related to payload size.');
        }
      } else {
        console.log(`Error: ${error.message}`);
      }
    }
  }
  
  console.log('\nBody Size Limits Test Summary:');
  console.log(`- Tested ${TEST_SIZES.length} different payload sizes`);
  console.log(`- Configured limit is ${LIMIT_SIZE / 1024}KB (1MB)`);
  console.log('- Check results above to determine if limits are correctly applied');
}

/**
 * Run all body size limits tests
 */
async function runAllTests() {
  console.log('=== Body Size Limits Tests ===');
  console.log('These tests will check if request body size limits are properly implemented.');
  console.log('Make sure your server is running before starting the tests.\n');
  
  try {
    await testBodySizeLimits();
  } catch (error) {
    console.error('Error running tests:', error);
  }
  
  console.log('\n=== Body Size Limits Tests Complete ===');
}

// Run the tests if called directly (node bodyLimits.test.js)
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testBodySizeLimits,
  runAllTests
}; 
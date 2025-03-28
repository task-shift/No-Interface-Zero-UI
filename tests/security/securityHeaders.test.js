/**
 * Security Headers Tests
 * 
 * This file contains tests for the security headers set by Helmet middleware.
 * These tests verify that important security headers are present in HTTP responses.
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';

// List of critical security headers to check for
const SECURITY_HEADERS = [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'x-xss-protection',
  'strict-transport-security',
  'referrer-policy'
];

/**
 * Tests if security headers are present in the response
 */
async function testSecurityHeaders() {
  console.log('\n--- Testing Security Headers ---');
  console.log('Checking for the presence of security headers in the API response...');
  
  try {
    // Make a request to a simple endpoint
    const response = await axios.get(`${API_URL}/api/auth/verification-status?email=test@example.com`);
    
    console.log(`Response Status: ${response.status}`);
    console.log('\nFound Headers:');
    
    // Extract headers
    const headers = response.headers;
    
    // Check for each security header
    const results = SECURITY_HEADERS.map(header => {
      const present = !!headers[header];
      console.log(`- ${header}: ${present ? '✅ Present' : '❌ Missing'} ${present ? `(${headers[header]})` : ''}`);
      return { header, present };
    });
    
    // Count present and missing headers
    const presentCount = results.filter(r => r.present).length;
    const missingCount = results.filter(r => !r.present).length;
    
    console.log(`\nSummary: ${presentCount}/${SECURITY_HEADERS.length} security headers present`);
    
    if (missingCount === 0) {
      console.log('✅ All expected security headers are present!');
    } else {
      console.log(`⚠️ ${missingCount} security headers are missing. Check Helmet configuration.`);
    }
  } catch (error) {
    console.log('Error testing security headers:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Headers:', error.response.headers);
    } else {
      console.log(error.message);
    }
  }
}

/**
 * Tests for other common security headers beyond the critical ones
 */
async function testAdditionalSecurityHeaders() {
  console.log('\n--- Testing Additional Security Headers ---');
  console.log('Checking for the presence of additional security headers...');
  
  // List of additional security headers that might be present
  const ADDITIONAL_HEADERS = [
    'feature-policy',
    'permissions-policy',
    'cross-origin-embedder-policy',
    'cross-origin-opener-policy',
    'cross-origin-resource-policy',
    'expect-ct'
  ];
  
  try {
    // Make a request to a simple endpoint
    const response = await axios.get(`${API_URL}/api/auth/verification-status?email=test@example.com`);
    
    // Extract headers
    const headers = response.headers;
    
    // Check for each additional security header
    let presentCount = 0;
    
    console.log('\nAdditional Headers:');
    ADDITIONAL_HEADERS.forEach(header => {
      const present = !!headers[header];
      if (present) {
        presentCount++;
        console.log(`- ${header}: ✅ Present (${headers[header]})`);
      } else {
        console.log(`- ${header}: ⚠️ Not found - This may be acceptable depending on your security requirements`);
      }
    });
    
    console.log(`\nSummary: ${presentCount}/${ADDITIONAL_HEADERS.length} additional security headers present`);
    console.log('Note: Not all additional headers are required for every application.');
  } catch (error) {
    console.log('Error testing additional security headers:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
    } else {
      console.log(error.message);
    }
  }
}

/**
 * Run all security header tests
 */
async function runAllTests() {
  console.log('=== Security Headers Tests ===');
  console.log('These tests will check if important security headers are present in HTTP responses.');
  console.log('Make sure your server is running before starting the tests.\n');
  
  try {
    await testSecurityHeaders();
    await testAdditionalSecurityHeaders();
  } catch (error) {
    console.error('Error running tests:', error);
  }
  
  console.log('\n=== Security Headers Tests Complete ===');
}

// Run the tests if called directly (node securityHeaders.test.js)
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSecurityHeaders,
  testAdditionalSecurityHeaders,
  runAllTests
}; 
/**
 * IP Filtering Tests
 * 
 * This file contains tests for the IP filtering functionality.
 * These tests verify that blacklisted IPs are properly blocked.
 * 
 * CAUTION: This test temporarily modifies your IP blacklist file.
 * It will add a test IP to the blacklist, and then remove it afterward.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:3000';
const IP_FILTER_FILE_PATH = path.join(__dirname, '../../middleware/ipFilter.js');

/**
 * Tests IP blacklisting by temporarily adding a test IP to the blacklist
 */
async function testIPBlacklisting() {
  console.log('\n--- Testing IP Blacklisting ---');
  
  // Step 1: Save the original ipFilter.js content
  console.log('Saving original IP filter configuration...');
  let originalFileContent;
  try {
    originalFileContent = fs.readFileSync(IP_FILTER_FILE_PATH, 'utf8');
  } catch (error) {
    console.error('Error reading IP filter file:', error);
    return;
  }

  try {
    // Step 2: Add localhost IP (127.0.0.1) to the blacklist
    console.log('Temporarily adding 127.0.0.1, localhost to the blacklist...');
    
    const modifiedContent = originalFileContent.replace(
      'const blacklistedIPs = [',
      'const blacklistedIPs = [\n  \'127.0.0.1\', // Test IP - will be removed'
    );
    
    fs.writeFileSync(IP_FILTER_FILE_PATH, modifiedContent, 'utf8');
    
    // Step 3: Reminder to restart the server
    console.log('\n⚠️ IMPORTANT: You need to restart your server for the IP blacklist changes to take effect.');
    console.log('After restarting, press Enter to continue with the test...');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', data => {
        resolve();
      });
    });
    
    // Step 4: Test a request to the server (should be blocked)
    console.log('\nTesting request to server (should be blocked)...');
    
    try {
      const response = await axios.get(`${API_URL}/api/auth/verification-status?email=test@example.com`);
      console.log(`Response Status: ${response.status}`);
      console.log('❌ IP blacklisting does not appear to be working! Expected to be blocked but request succeeded.');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(`Response Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        console.log('✅ IP blacklisting is working! Request was blocked as expected.');
      } else {
        console.log(`Error: ${error.message}`);
        console.log('❌ Request failed, but not because of IP blacklisting. This may indicate a different issue.');
      }
    }
  } finally {
    // Step 5: Restore the original IP filter file content
    console.log('\nRestoring original IP filter configuration...');
    fs.writeFileSync(IP_FILTER_FILE_PATH, originalFileContent, 'utf8');
    
    console.log('⚠️ IMPORTANT: You need to restart your server again to restore the original IP configuration.');
    console.log('IP blacklisting test complete.');
  }
}

/**
 * Run all IP filtering tests
 */
async function runAllTests() {
  console.log('=== IP Filtering Tests ===');
  console.log('These tests will check if IP blacklisting is properly implemented.');
  console.log('⚠️ CAUTION: This will temporarily modify your ipFilter.js file and requires server restarts.');
  
  try {
    await testIPBlacklisting();
  } catch (error) {
    console.error('Error running tests:', error);
  }
  
  console.log('\n=== IP Filtering Tests Complete ===');
}

// Run the tests if called directly (node ipFilter.test.js)
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testIPBlacklisting,
  runAllTests
}; 
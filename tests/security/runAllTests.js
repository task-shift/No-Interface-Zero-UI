/**
 * DDOS Protection Test Suite
 * 
 * This script runs all the security tests in sequence to verify that
 * your DDOS protection system is working properly.
 */

const rateLimiterTests = require('./rateLimiter.test');
const ipFilterTests = require('./ipFilter.test');
const securityHeadersTests = require('./securityHeaders.test');
const bodyLimitsTests = require('./bodyLimits.test');

// ASCII art banner for a nicer output
const banner = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██████╗ ██████╗  ██████╗ ███████╗    ████████╗███████╗███████╗████████╗███████╗  ║
║   ██╔══██╗██╔══██╗██╔═══██╗██╔════╝    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██╔════╝  ║
║   ██║  ██║██║  ██║██║   ██║███████╗       ██║   █████╗  ███████╗   ██║   ███████╗  ║
║   ██║  ██║██║  ██║██║   ██║╚════██║       ██║   ██╔══╝  ╚════██║   ██║   ╚════██║  ║
║   ██████╔╝██████╔╝╚██████╔╝███████║       ██║   ███████╗███████║   ██║   ███████║  ║
║   ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝       ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚══════╝  ║
║                                                              ║
║   Security & Protection Test Suite                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

/**
 * Runs all security tests in sequence
 */
async function runAllTests() {
  console.log(banner);
  console.log('Starting comprehensive security test suite...');
  console.log('This test suite will verify that your DDOS protection measures are working.');
  console.log('Make sure your server is running before proceeding.\n');
  
  // Ask user if they're ready to begin
  await new Promise(resolve => {
    console.log('Press Enter to begin testing, or Ctrl+C to cancel...');
    process.stdin.once('data', data => {
      resolve();
    });
  });
  
  try {
    // Test security headers first (this is non-invasive)
    console.log('\n\n==================================================');
    console.log('STEP 1: TESTING SECURITY HEADERS');
    console.log('==================================================');
    await securityHeadersTests.runAllTests();
    
    // Then test body size limits (also non-invasive)
    console.log('\n\n==================================================');
    console.log('STEP 2: TESTING BODY SIZE LIMITS');
    console.log('==================================================');
    await bodyLimitsTests.runAllTests();
    
    // Then test rate limiting (can affect subsequent tests, so we run it later)
    console.log('\n\n==================================================');
    console.log('STEP 3: TESTING RATE LIMITING');
    console.log('==================================================');
    await rateLimiterTests.runAllTests();
    
    // Finally test IP filtering (requires server restarts, so we do it last)
    console.log('\n\n==================================================');
    console.log('STEP 4: TESTING IP FILTERING (requires server restarts)');
    console.log('==================================================');
    await ipFilterTests.runAllTests();
    
    console.log('\n\n==================================================');
    console.log('ALL SECURITY TESTS COMPLETE');
    console.log('==================================================');
    console.log('Check the results above to see if your DDOS protection is working correctly.');
    console.log('Remember to restart your server after these tests to ensure a clean state.');
    
  } catch (error) {
    console.error('Error running security tests:', error);
  }
}

// Run the tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests
}; 
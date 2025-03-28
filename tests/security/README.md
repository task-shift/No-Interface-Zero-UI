# DDOS Protection Test Suite

This directory contains a comprehensive set of tests to verify that your DDOS protection measures are working correctly.

## Overview

The test suite includes tests for:

1. **Rate Limiting** - Tests if rate limiting is correctly applied to different endpoints
2. **IP Blacklisting** - Tests if blacklisted IPs are properly blocked
3. **Security Headers** - Tests if important security headers are present in responses
4. **Body Size Limits** - Tests if large request bodies are properly rejected
5. **Load Testing** - Simulates high traffic to test how the API responds under stress

## Running the Tests

You can run individual tests or the entire test suite using the npm scripts defined in `package.json`.

### Running the Complete Test Suite

```bash
npm run test:security
```

This will run all tests in sequence and provide a comprehensive report.

### Running Individual Tests

```bash
# Test security headers
npm run test:security:headers

# Test rate limiting
npm run test:security:rate-limit

# Test IP blacklisting
npm run test:security:ip-filter

# Test body size limits
npm run test:security:body-limits

# Run load tests / DDOS simulation
npm run test:load
```

## Important Notes

1. **Always run these tests on development/test environments only**, never on production systems without proper authorization.

2. **The IP blacklisting test requires server restarts** to apply the changes to the IP filter configuration.

3. **After running the rate limiting tests, you may need to restart your server** to reset the rate limiters, especially if you plan to run other tests afterward.

4. **The load test can cause significant server load** and may trigger actual rate limiting or other DDOS protection measures. Make sure your system can handle this before running the test.

## Test Files

- `runAllTests.js` - Main script that runs all security tests in sequence
- `rateLimiter.test.js` - Tests for rate limiting functionality
- `ipFilter.test.js` - Tests for IP blacklisting functionality
- `securityHeaders.test.js` - Tests for security headers
- `bodyLimits.test.js` - Tests for body size limits
- `loadTest.js` - Load testing / DDOS simulation script

## Interpreting Results

Each test provides detailed output about what it's testing and whether the test passed or failed. Look for these indicators:

- ✅ - Indicates that a test passed or a feature is working correctly
- ❌ - Indicates that a test failed or a feature is not working correctly
- ⚠️ - Warning or information that requires attention
- ❓ - Indicates an inconclusive result that requires further investigation

## Troubleshooting

If tests are failing, check these common issues:

1. **Rate limiting not detected**: Ensure the `express-rate-limit` middleware is properly configured and applied to your routes.

2. **Security headers missing**: Check your Helmet configuration in `app.js`.

3. **IP blacklisting not working**: Verify that the IP filter middleware is correctly applied in your Express application and that the server was restarted after changes.

4. **Body size limits not enforced**: Check that you've configured the body parser middleware with proper limits.

## Customizing Tests

You can modify the test parameters by editing the configuration variables at the top of each test file. Common parameters you might want to change include:

- `API_URL` - The base URL of your API
- Rate limits for different endpoints
- Test duration and concurrency settings for load tests 
/**
 * Load Testing / DDOS Simulation
 * 
 * This script simulates a high load on your API to test
 * how it responds under stress.
 * 
 * WARNING: Only use this on test/development servers!
 * NEVER run this against production systems without proper authorization.
 */

const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

// Configuration
const API_URL = 'http://localhost:3000';
const DEFAULT_DURATION_SECONDS = 10;
const DEFAULT_CONCURRENT_REQUESTS = 100;
const MAX_WORKERS = os.cpus().length;

/**
 * Worker thread function to send a batch of requests
 */
function runWorker(data) {
  const { url, count, requestData } = data;
  
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { url, count, requestData }
    });
    
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

/**
 * Worker thread code - runs in separate threads
 */
if (!isMainThread) {
  const { url, count, requestData } = workerData;
  
  // Track results
  const results = {
    total: count,
    successful: 0,
    failed: 0,
    statusCodes: {},
    errorTypes: {}
  };
  
  // Send requests in a loop
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    const promise = axios.post(url, requestData, {
      timeout: 10000, // 10 second timeout
      validateStatus: () => true // Don't throw errors for non-2xx responses
    })
    .then(response => {
      results.successful++;
      results.statusCodes[response.status] = (results.statusCodes[response.status] || 0) + 1;
      return response;
    })
    .catch(error => {
      results.failed++;
      
      const errorType = error.code || 'UNKNOWN';
      results.errorTypes[errorType] = (results.errorTypes[errorType] || 0) + 1;
      
      return error;
    });
    
    promises.push(promise);
  }
  
  // When all requests are complete, send results back to main thread
  Promise.all(promises)
    .then(() => {
      parentPort.postMessage(results);
    })
    .catch(error => {
      console.error('Worker error:', error);
      parentPort.postMessage(results);
    });
}

/**
 * Runs a load test against the specified endpoint
 */
async function runLoadTest(options = {}) {
  const {
    url = `${API_URL}/api/auth/login`,
    concurrentRequests = DEFAULT_CONCURRENT_REQUESTS,
    durationSeconds = DEFAULT_DURATION_SECONDS,
    requestData = { login: 'testuser', password: 'testpassword' }
  } = options;
  
  console.log('\n--- Load Testing / DDOS Simulation ---');
  console.log('WARNING: This is for testing purposes only!');
  console.log(`Target: ${url}`);
  console.log(`Duration: ${durationSeconds} seconds`);
  console.log(`Concurrent Requests: ${concurrentRequests}`);
  console.log(`Using ${MAX_WORKERS} worker threads for higher throughput`);
  
  const startTime = Date.now();
  const endTime = startTime + (durationSeconds * 1000);
  
  // Track overall results
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    statusCodes: {},
    errorTypes: {},
    batches: 0
  };
  
  // Calculate requests per worker
  const requestsPerWorker = Math.ceil(concurrentRequests / MAX_WORKERS);
  
  // Run until the time is up
  while (Date.now() < endTime) {
    const batchStart = Date.now();
    console.log(`\nStarting batch #${results.batches + 1}...`);
    
    // Create a batch of workers
    const workerPromises = [];
    
    for (let i = 0; i < MAX_WORKERS; i++) {
      workerPromises.push(runWorker({
        url,
        count: requestsPerWorker,
        requestData
      }));
    }
    
    // Wait for all workers to complete
    const workerResults = await Promise.all(workerPromises);
    
    // Combine results
    for (const result of workerResults) {
      results.totalRequests += result.total;
      results.successfulRequests += result.successful;
      results.failedRequests += result.failed;
      
      // Combine status codes
      for (const [code, count] of Object.entries(result.statusCodes)) {
        results.statusCodes[code] = (results.statusCodes[code] || 0) + count;
      }
      
      // Combine error types
      for (const [type, count] of Object.entries(result.errorTypes)) {
        results.errorTypes[type] = (results.errorTypes[type] || 0) + count;
      }
    }
    
    results.batches++;
    
    const batchDuration = (Date.now() - batchStart) / 1000;
    const requestsPerSecond = Math.round(concurrentRequests / batchDuration);
    
    console.log(`Batch completed in ${batchDuration.toFixed(2)} seconds`);
    console.log(`Rate: ${requestsPerSecond} requests/second`);
    console.log(`Success/Fail: ${results.successfulRequests}/${results.failedRequests}`);
    
    // Check if we have time for another batch
    if (Date.now() + (batchDuration * 1000) >= endTime) {
      break;
    }
  }
  
  const totalDuration = (Date.now() - startTime) / 1000;
  const overallRequestsPerSecond = Math.round(results.totalRequests / totalDuration);
  
  // Print results
  console.log('\n=== Load Test Results ===');
  console.log(`Duration: ${totalDuration.toFixed(2)} seconds`);
  console.log(`Total Requests: ${results.totalRequests}`);
  console.log(`Successful Requests: ${results.successfulRequests}`);
  console.log(`Failed Requests: ${results.failedRequests}`);
  console.log(`Overall Rate: ${overallRequestsPerSecond} requests/second`);
  
  console.log('\nStatus Code Distribution:');
  for (const [code, count] of Object.entries(results.statusCodes)) {
    const percentage = ((count / results.totalRequests) * 100).toFixed(2);
    console.log(`- ${code}: ${count} (${percentage}%)`);
  }
  
  if (Object.keys(results.errorTypes).length > 0) {
    console.log('\nError Type Distribution:');
    for (const [type, count] of Object.entries(results.errorTypes)) {
      const percentage = ((count / results.failedRequests) * 100).toFixed(2);
      console.log(`- ${type}: ${count} (${percentage}%)`);
    }
  }
  
  // Check for rate limiting
  if (results.statusCodes['429']) {
    console.log('\n✅ Rate limiting is working! Detected 429 Too Many Requests responses.');
  } else {
    console.log('\n⚠️ No rate limiting responses (429) detected. This might mean:');
    console.log('  - Rate limiting is not working correctly');
    console.log('  - The test did not generate enough load to trigger rate limiting');
    console.log('  - Rate limiting is handled at a different level not visible to this test');
  }
  
  return results;
}

/**
 * Run load tests against various endpoints
 */
async function runAllTests() {
  console.log('=== Load Testing / DDOS Simulation ===');
  console.log('This script will simulate a high load on your API to test how it responds under stress.');
  console.log('WARNING: Only use this on test/development servers!');
  console.log('NEVER run this against production systems without proper authorization.\n');
  
  // Ask user if they're ready to begin
  await new Promise(resolve => {
    console.log('Press Enter to begin load testing, or Ctrl+C to cancel...');
    process.stdin.once('data', data => {
      resolve();
    });
  });
  
  try {
    // Test authentication endpoint
    console.log('\n\n==================================================');
    console.log('TESTING AUTHENTICATION ENDPOINT');
    console.log('==================================================');
    await runLoadTest({
      url: `${API_URL}/api/auth/login`,
      concurrentRequests: 100,
      durationSeconds: 10,
      requestData: { login: 'testuser', password: 'testpassword' }
    });
    
    // Test verification endpoint
    console.log('\n\n==================================================');
    console.log('TESTING VERIFICATION ENDPOINT');
    console.log('==================================================');
    await runLoadTest({
      url: `${API_URL}/api/auth/send-verification`,
      concurrentRequests: 50,
      durationSeconds: 5,
      requestData: { email: 'test@example.com' }
    });
    
    console.log('\n\n==================================================');
    console.log('LOAD TESTING COMPLETE');
    console.log('==================================================');
    console.log('Check the results above to see how your API performed under stress.');
    
  } catch (error) {
    console.error('Error running load tests:', error);
  }
}

// Run the tests if called directly
if (isMainThread && require.main === module) {
  runAllTests();
}

module.exports = {
  runLoadTest,
  runAllTests
}; 
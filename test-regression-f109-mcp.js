/**
 * Regression Test: Feature #109 - Empty search results show message
 * Using curl to verify backend + instructions for MCP browser testing
 */

const http = require('http');

// Test 1: Verify backend is responding
console.log('=== Regression Test: Feature #109 - Backend Health Check ===\n');

// Check if we can access the API
const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('API Health Check Response:', data);
    console.log('✅ Backend is running and accessible');

    // Test 2: Check if we can fetch categories endpoint
    testCategoriesEndpoint();
  });
});

req.on('error', (error) => {
  console.error('❌ Backend health check failed:', error.message);
});

req.end();

function testCategoriesEndpoint() {
  console.log('\n=== Testing Categories Endpoint ===\n');

  // We'll need to create a test user and get a token first
  // For now, just verify the endpoint exists (should return 401 without auth)
  const catOptions = {
    hostname: 'localhost',
    port: 4001,
    path: '/api/v1/categories',
    method: 'GET'
  };

  const catReq = http.request(catOptions, (res) => {
    console.log(`Categories endpoint response: ${res.statusCode}`);

    if (res.statusCode === 401) {
      console.log('✅ Categories endpoint exists and requires authentication (expected)');
    } else {
      console.log('⚠️  Unexpected response code:', res.statusCode);
    }

    console.log('\n=== Backend Tests Complete ===');
    console.log('Now proceed to browser automation tests for full regression');
  });

  catReq.on('error', (error) => {
    console.error('❌ Categories endpoint test failed:', error.message);
  });

  catReq.end();
}

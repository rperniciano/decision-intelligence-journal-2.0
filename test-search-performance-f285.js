/**
 * Test search performance for Feature #285
 * Measures API response time for search queries with 150 decisions
 */

const TEST_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:4017/api/v1';

async function testSearchPerformance() {
  console.log('=== Feature #285: Search Performance Test ===\n');

  // First, login to get token
  console.log('1. Logging in...');
  const loginResponse = await fetch(`${TEST_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test_f285_search_perf@example.com',
      password: 'Test1234!'
    })
  });

  if (!loginResponse.ok) {
    console.error('❌ Login failed');
    return;
  }

  const { token } = await loginResponse.json();
  console.log('✅ Logged in\n');

  // Test different search queries
  const searchQueries = [
    { query: 'F285_TEST', expected: '30 results (every 5th decision)' },
    { query: 'Career', expected: '~50 results (every 3rd decision)' },
    { query: 'F285_Search', expected: '~100 results (2 out of 3)' },
    { query: 'Decision', expected: '~150 results (almost all)' },
    { query: 'nonexistent', expected: '0 results' },
  ];

  const results = [];

  for (const test of searchQueries) {
    console.log(`2. Testing search for: "${test.query}"`);
    console.log(`   Expected: ${test.expected}`);

    const startTime = performance.now();

    const response = await fetch(
      `${API_BASE}/decisions?search=${encodeURIComponent(test.query)}&limit=10&sort=date_desc`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const endTime = performance.now();
    const responseTime = (endTime - startTime).toFixed(2);

    if (response.ok) {
      const data = await response.json();
      const resultCount = data.total || data.decisions?.length || 0;

      console.log(`   ✅ Response time: ${responseTime}ms`);
      console.log(`   ✅ Results: ${resultCount} decisions`);

      if (parseFloat(responseTime) < 1000) {
        console.log(`   ✅ PASSED: Under 1 second\n`);
        results.push({ query: test.query, time: parseFloat(responseTime), passed: true });
      } else {
        console.log(`   ❌ FAILED: Over 1 second\n`);
        results.push({ query: test.query, time: parseFloat(responseTime), passed: false });
      }
    } else {
      console.log(`   ❌ Request failed: ${response.status}\n`);
      results.push({ query: test.query, time: -1, passed: false });
    }
  }

  // Summary
  console.log('=== Performance Summary ===');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const avgTime = results.filter(r => r.time > 0).reduce((a, b) => a + b.time, 0) / results.filter(r => r.time > 0).length;

  console.log(`Tests passed: ${passed}/${total}`);
  console.log(`Average response time: ${avgTime.toFixed(2)}ms`);
  console.log(`Fastest search: ${Math.min(...results.filter(r => r.time > 0).map(r => r.time)).toFixed(2)}ms`);
  console.log(`Slowest search: ${Math.max(...results.filter(r => r.time > 0).map(r => r.time)).toFixed(2)}ms`);

  if (passed === total && avgTime < 1000) {
    console.log('\n✅ Feature #285: PASSED - All searches complete in under 1 second');
    process.exit(0);
  } else {
    console.log('\n❌ Feature #285: FAILED - Some searches exceeded 1 second');
    process.exit(1);
  }
}

testSearchPerformance().catch(console.error);

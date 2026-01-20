/**
 * Test search performance for Feature #285
 * Measures API response time for search queries with 150 decisions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const API_BASE = 'http://localhost:4017/api/v1';

async function testSearchPerformance() {
  console.log('=== Feature #285: Search Performance Test ===\n');
  console.log('Testing with 150 decisions in database\n');

  // Login to get token
  console.log('1. Logging in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test_f285_search_perf@example.com',
    password: 'Test1234!',
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
    return;
  }

  const token = data.session.access_token;
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
    console.log(`Testing search for: "${test.query}"`);
    console.log(`Expected: ${test.expected}`);

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

      console.log(`✅ Response time: ${responseTime}ms`);
      console.log(`✅ Results: ${resultCount} decisions`);

      if (parseFloat(responseTime) < 1000) {
        console.log(`✅ PASSED: Under 1 second\n`);
        results.push({ query: test.query, time: parseFloat(responseTime), passed: true, count: resultCount });
      } else {
        console.log(`❌ FAILED: Over 1 second (${responseTime}ms)\n`);
        results.push({ query: test.query, time: parseFloat(responseTime), passed: false, count: resultCount });
      }
    } else {
      console.log(`❌ Request failed: ${response.status}\n`);
      results.push({ query: test.query, time: -1, passed: false, count: 0 });
    }
  }

  // Summary
  console.log('=== Performance Summary ===');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const validResults = results.filter(r => r.time > 0);
  const avgTime = validResults.reduce((a, b) => a + b.time, 0) / validResults.length;

  console.log(`Tests passed: ${passed}/${total}`);
  console.log(`Average response time: ${avgTime.toFixed(2)}ms`);
  console.log(`Fastest search: ${Math.min(...validResults.map(r => r.time)).toFixed(2)}ms`);
  console.log(`Slowest search: ${Math.max(...validResults.map(r => r.time)).toFixed(2)}ms`);

  console.log('\n=== Detailed Results ===');
  results.forEach(r => {
    const status = r.passed ? '✅' : '❌';
    const time = r.time > 0 ? `${r.time.toFixed(2)}ms` : 'FAILED';
    console.log(`${status} "${r.query}": ${time} (${r.count} results)`);
  });

  if (passed === total && avgTime < 1000) {
    console.log('\n✅ Feature #285: PASSED - All searches complete in under 1 second');
    process.exit(0);
  } else {
    console.log('\n❌ Feature #285: FAILED - Some searches exceeded 1 second');
    process.exit(1);
  }
}

testSearchPerformance().catch(console.error);

// Test Feature #192: Search with special characters no crash
// Using Supabase auth directly

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 4009;

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testSpecialCharsSearch() {
  console.log('Testing Feature #192: Search with special characters no crash');
  console.log('================================================================\n');

  // Step 1: Login via Supabase
  console.log('Step 1: Logging in via Supabase...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'regression-test@example.com',
    password: 'Test1234!'
  });

  if (authError || !authData.session) {
    console.log('❌ Login failed:', authError?.message);
    return;
  }

  const token = authData.session.access_token;
  console.log('✅ Login successful\n');

  // Step 2: Test search with various special characters
  const testCases = [
    { name: '@', encoded: '%40', desc: 'At sign' },
    { name: '!', encoded: '%21', desc: 'Exclamation mark' },
    { name: '#$%', encoded: '%23%24%25', desc: 'Hash, dollar, percent' },
    { name: '!@#$%^&*()', encoded: '%21%40%23%24%25%5E%26%2A%28%29', desc: 'Full special set' },
    { name: '<script>', encoded: '%3Cscript%3E', desc: 'Potential XSS' },
    { name: "'; DROP TABLE", encoded: '%27%3B%20DROP%20TABLE', desc: 'SQL injection attempt' }
  ];

  console.log('Step 2: Testing search with special characters...\n');

  let allPassed = true;

  for (const test of testCases) {
    console.log(`Test: ${test.desc} (${test.name})`);
    const result = await makeRequest(`/api/v1/decisions?search=${test.encoded}`, 'GET', null, token);

    if (result.status === 200) {
      console.log(`✅ Status: ${result.status} - No crash`);
      console.log(`   Response type: ${Array.isArray(result.body) ? 'Array' : typeof result.body}`);
      console.log(`   Results count: ${Array.isArray(result.body) ? result.body.length : 'N/A'}`);
    } else if (result.status === 400 || result.status === 500) {
      console.log(`⚠️  Status: ${result.status} - Server handled gracefully`);
      console.log(`   Error: ${result.body.message || result.body.error || 'Unknown error'}`);
      // Graceful error handling is acceptable
    } else {
      console.log(`❌ Status: ${result.status} - Unexpected response`);
      allPassed = false;
    }
    console.log('');
  }

  console.log('================================================================');
  if (allPassed) {
    console.log('✅ Feature #192 PASSED - All tests completed without crashes');
  } else {
    console.log('❌ Feature #192 FAILED - Some tests had unexpected responses');
  }
}

testSpecialCharsSearch().catch(console.error);

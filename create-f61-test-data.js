const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 4001;

function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

async function main() {
  try {
    console.log('=== Creating test data for Feature #61 ===\n');

    // Login
    console.log('1. Logging in as f61test@example.com...');
    const loginResponse = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'f61test@example.com',
      password: 'test123456'
    });

    if (!loginResponse.token && !loginResponse.access_token) {
      console.error('Login failed:', loginResponse);
      process.exit(1);
    }

    const token = loginResponse.token || loginResponse.access_token;
    console.log('   ✓ Login successful\n');

    // Get categories
    console.log('2. Getting categories...');
    const categories = await makeRequest('GET', '/api/v1/categories', null, token);

    if (!categories || categories.length === 0) {
      console.error('No categories found');
      process.exit(1);
    }

    const categoryId = categories[0].id;
    console.log(`   ✓ Using category: ${categoryId}\n`);

    // Create DECISION_A
    console.log('3. Creating DECISION_A...');
    const decisionA = await makeRequest('POST', '/api/v1/decisions', {
      title: 'DECISION_A - Test Feature 61',
      category_id: categoryId
    }, token);

    if (!decisionA.id) {
      console.error('Failed to create DECISION_A:', decisionA);
      process.exit(1);
    }

    console.log(`   ✓ DECISION_A created: ${decisionA.id}\n`);

    // Create DECISION_B
    console.log('4. Creating DECISION_B...');
    const decisionB = await makeRequest('POST', '/api/v1/decisions', {
      title: 'DECISION_B - Test Feature 61',
      category_id: categoryId
    }, token);

    if (!decisionB.id) {
      console.error('Failed to create DECISION_B:', decisionB);
      process.exit(1);
    }

    console.log(`   ✓ DECISION_B created: ${decisionB.id}\n`);

    // Create outcome for DECISION_A
    console.log('5. Creating outcome for DECISION_A...');
    const outcome = await makeRequest('POST', `/api/v1/decisions/${decisionA.id}/outcomes`, {
      satisfaction_level: 7,
      outcome_text: 'This outcome should only appear on DECISION_A',
      would_choose_same_option: true
    }, token);

    if (outcome.error) {
      console.error('Failed to create outcome:', outcome);
      // Continue anyway - we can test without outcomes
    } else {
      console.log(`   ✓ Outcome created\n`);
    }

    console.log('=== Test Data Created Successfully ===\n');
    console.log('Login credentials:');
    console.log('  Email: f61test@example.com');
    console.log('  Password: test123456\n');
    console.log('Test URLs:');
    console.log(`  DECISION_A: http://localhost:5190/decisions/${decisionA.id}`);
    console.log(`  DECISION_B: http://localhost:5190/decisions/${decisionB.id}\n`);
    console.log('Test Steps:');
    console.log('1. Navigate to DECISION_A');
    console.log('2. Verify outcome appears (if outcome table exists)');
    console.log('3. Navigate to DECISION_B');
    console.log('4. Verify NO outcome appears');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

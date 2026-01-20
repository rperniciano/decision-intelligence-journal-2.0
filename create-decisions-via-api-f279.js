// Create test decisions via API for Feature #279 testing
const http = require('http');

const API_URL = 'localhost';
const API_PORT = 3001;

// Test user token (we'll need to get this after login)
let authToken = '';

// Login first
function login(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });

    const options = {
      hostname: API_URL,
      port: API_PORT,
      path: '/api/v1/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.token) {
            authToken = response.token;
            resolve(authToken);
          } else {
            reject(new Error('No token in response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Create a decision
function createDecision(title, category) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      title,
      category,
      status: 'decided',
      options: [
        {
          id: 'opt-1',
          text: 'Option A',
          pros: ['Pro 1', 'Pro 2'],
          cons: ['Con 1'],
          isChosen: true
        }
      ]
    });

    const options = {
      hostname: API_URL,
      port: API_PORT,
      path: '/api/v1/decisions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('Logging in...');
    await login('f279-test-1768901380856@example.com', 'Test123456!');
    console.log('✅ Logged in successfully');

    const decisions = [
      { title: 'F279 Career Decision 1', category: 'Career' },
      { title: 'F279 Career Decision 2', category: 'Career' },
      { title: 'F279 Health Decision', category: 'Health' },
      { title: 'F279 Financial Decision', category: 'Financial' }
    ];

    console.log('\nCreating test decisions...');
    for (const dec of decisions) {
      try {
        const result = await createDecision(dec.title, dec.category);
        console.log(`✅ Created: ${dec.title} (Category: ${dec.category})`);
      } catch (e) {
        console.error(`❌ Error creating ${dec.title}:`, e.message);
      }
    }

    console.log('\n✅ Test decisions created successfully!');
    console.log('- Career: 2 decisions');
    console.log('- Health: 1 decision');
    console.log('- Financial: 1 decision');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

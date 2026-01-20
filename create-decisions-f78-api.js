const http = require('http');

function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function main() {
  console.log('Creating test decisions for Feature #78...\n');

  // Login
  const loginRes = await makeRequest('http://localhost:4001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'f96-test-1768888401473@example.com',
    password: 'Test1234!'
  });

  if (!loginRes.body.token) {
    console.error('Login failed:', loginRes.body);
    return;
  }

  const token = loginRes.body.token;
  console.log('✓ Logged in successfully');

  // Create decisions with different emotions
  const emotions = ['anxious', 'confident', 'calm', 'excited', 'stressed'];
  const timestamp = Date.now();

  for (const emotion of emotions) {
    const title = `F78 Test - ${emotion.charAt(0).toUpperCase() + emotion.slice(1)} Decision - ${timestamp}`;

    const createRes = await makeRequest('http://localhost:4001/api/v1/decisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      title,
      transcript: `Test transcript for decision with emotion: ${emotion}`,
      status: 'decided',
      emotionalState: emotion,
      recordedAt: new Date().toISOString(),
      decidedAt: new Date().toISOString()
    });

    if (createRes.status === 201 || createRes.status === 200) {
      console.log(`✓ Created: "${title}" with emotion: ${emotion}`);
    } else {
      console.error(`✗ Failed (${createRes.status}):`, createRes.body);
    }
  }

  console.log(`\n✅ Done! Timestamp: ${timestamp}`);
}

main().catch(console.error);

// Test Feature #207: Title max length validation via API
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const env = {};

for (const line of envLines) {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
}

// Login to get token
const response = await fetch('http://localhost:4001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'f207-test-1768927504756@example.com',
    password: 'test123456'
  })
});

const loginData = await response.json();
if (!loginData.data?.session?.access_token) {
  console.error('Login failed:', loginData);
  process.exit(1);
}

const token = loginData.data.session.access_token;

// Test 1: Try to create decision with 201 characters
const title201 = 'A'.repeat(201);

console.log('Test 1: Creating decision with 201 character title...');
const res201 = await fetch('http://localhost:4001/api/v1/decisions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: title201,
    status: 'decided'
  })
});

console.log('Status:', res201.status);
const text201 = await res201.text();
console.log('Response:', text201.substring(0, 300));

// Test 2: Try to create decision with exactly 200 characters
const title200 = 'B'.repeat(200);

console.log('\nTest 2: Creating decision with 200 character title...');
const res200 = await fetch('http://localhost:4001/api/v1/decisions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: title200,
    status: 'decided'
  })
});

console.log('Status:', res200.status);
const text200 = await res200.text();
console.log('Response:', text200.substring(0, 300));

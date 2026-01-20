// Test script to create decisions and verify bulk delete
const fetch = require('node-fetch');

const API_URL = 'http://localhost:4001';
const TEST_EMAIL = 'feature56-test@example.com';
const TEST_PASS = 'Test123456!';

async function login() {
  const response = await fetch(`${API_URL}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS })
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

async function createDecision(token, title) {
  const response = await fetch(`${API_URL}/api/v1/decisions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, status: 'draft' })
  });
  if (!response.ok) throw new Error('Create failed');
  return response.json();
}

async function main() {
  console.log('Logging in...');
  const session = await login();
  const token = session.session.access_token;

  console.log('Creating 3 test decisions for bulk delete...');
  const decisions = [];
  for (let i = 1; i <= 3; i++) {
    const decision = await createDecision(token, `BULK_DELETE_TEST_20_${i}`);
    decisions.push(decision);
    console.log(`  Created: ${decision.id} - ${decision.title}`);
  }

  console.log('\nTest decisions created successfully!');
  console.log('Decision IDs:', decisions.map(d => d.id));
}

main().catch(console.error);

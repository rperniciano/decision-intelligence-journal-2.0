// Test script for Feature #146: Unsaved Changes Warning
// This script creates a test decision that can be used to verify the warning

import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load .env file
const envContent = readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

async function createTestDecision() {
  console.log('Creating test decision for Feature #146...');

  // Create a test user
  const testEmail = `f146-test-${Date.now()}@example.com`;
  const testPassword = 'test123456';

  // 1. Sign up
  const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  if (!signupResponse.ok) {
    throw new Error('Failed to sign up test user');
  }

  const { data: { session } } = await signupResponse.json();
  const token = session.access_token;

  // 2. Create a test decision
  const createResponse = await fetch('http://localhost:4001/decisions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'F146 Test Decision - Unsaved Changes',
      description: 'This decision is used to test the unsaved changes warning feature',
      status: 'draft',
    }),
  });

  if (!createResponse.ok) {
    throw new Error('Failed to create test decision');
  }

  const decision = await createResponse.json();

  // 3. Add options to the decision
  const option1Response = await fetch(`http://localhost:4001/decisions/${decision.id}/options`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Option A',
    }),
  });

  const option2Response = await fetch(`http://localhost:4001/decisions/${decision.id}/options`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Option B',
    }),
  });

  console.log('\n✅ Test decision created successfully!');
  console.log('Decision ID:', decision.id);
  console.log('Test Email:', testEmail);
  console.log('Test Password:', testPassword);
  console.log('\nYou can now test Feature #146:');
  console.log('1. Log in with the test credentials');
  console.log('2. Navigate to: http://localhost:5173/decisions/' + decision.id + '/edit');
  console.log('3. Make changes to the title or options');
  console.log('4. Try to click Cancel or the back button');
  console.log('5. Verify the unsaved changes warning appears');
  console.log('6. Try to close the browser tab/refresh');
  console.log('7. Verify the browser shows a confirmation dialog');
}

createTestDecision().catch(console.error);

// Setup script for Feature #179: Permanent delete removes all traces
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupTest() {
  console.log('Setting up test for Feature #179: Permanent delete...\n');

  const testEmail = 'permanent-delete-test@example.com';
  const testPassword = 'Test123456';

  // 1. Sign in to get token
  console.log('1. Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error('Error signing in:', signInError);
    return;
  }

  const userId = signInData.user.id;
  const token = signInData.session.access_token;
  console.log(`✓ Signed in as user: ${userId}`);

  // 2. Create a test decision via API
  console.log('\n2. Creating test decision via API...');

  const decision = {
    title: 'Decision for Permanent Delete Test',
    status: 'pending',
    category: 'Test',
    emotional_state: 'neutral',
    options: [
      {
        id: `opt-${Date.now()}-1`,
        text: 'Option A',
        pros: ['Pro 1'],
        cons: ['Con 1'],
        is_chosen: false,
      },
      {
        id: `opt-${Date.now()}-2`,
        text: 'Option B',
        pros: ['Pro 2'],
        cons: ['Con 2'],
        is_chosen: false,
      }
    ],
    notes: 'This decision will be permanently deleted to verify Feature #179'
  };

  const response = await fetch('http://localhost:4013/api/v1/decisions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(decision),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error creating decision:', error);
    return;
  }

  const decisionData = await response.json();
  console.log(`✓ Decision created: "${decisionData.title}" (ID: ${decisionData.id})`);

  console.log('\n=== Setup Complete ===');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  console.log(`Decision ID: ${decisionData.id}`);
  console.log('\nYou can now login and test permanent delete.');
  process.exit(0);
}

setupTest().catch(console.error);

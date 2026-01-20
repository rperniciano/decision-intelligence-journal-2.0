// Test script for Feature #211: Option position bias detection
// Creates decisions with multiple options and chooses specific positions

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testPositionBias() {
  console.log('=== Feature #211: Position Bias Detection Test ===\n');

  // Create a test user or use existing one
  const testEmail = 'f211.positionbias@example.com';
  const testPassword = 'TestPass123!';

  // First, try to login or create user
  let accessToken = null;
  let userId = null;

  try {
    // Try to sign in
    const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (signInResponse.ok) {
      const signInData = await signInResponse.json();
      accessToken = signInData.access_token;
      userId = signInData.user.id;
      console.log('✅ Logged in existing test user');
    } else {
      // Create new user
      const signUpResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      if (signUpResponse.ok) {
        const signUpData = await signUpResponse.json();
        accessToken = signUpData.access_token;
        userId = signUpData.user.id;
        console.log('✅ Created new test user');
      } else {
        throw new Error('Failed to create user');
      }
    }
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    return;
  }

  // Create test decisions with bias toward position 1 (first option)
  // We'll create 10 decisions, choosing the first option in 7 of them (70%)
  const testDecisions = [];

  for (let i = 1; i <= 10; i++) {
    const chooseFirst = i <= 7; // First 7 decisions choose first option

    const decision = {
      user_id: userId,
      title: `F211 Position Bias Test ${i}`,
      description: `Testing position bias detection - decision ${i}`,
      status: 'decided',
      category: 'Testing',
      options: [
        {
          id: `opt_${i}_1`,
          text: `First option for decision ${i}`,
          display_order: 1,
          pros: ['Pro 1', 'Pro 2'],
          cons: ['Con 1']
        },
        {
          id: `opt_${i}_2`,
          text: `Second option for decision ${i}`,
          display_order: 2,
          pros: ['Pro A'],
          cons: ['Con A', 'Con B']
        },
        {
          id: `opt_${i}_3`,
          text: `Third option for decision ${i}`,
          display_order: 3,
          pros: ['Pro X', 'Pro Y'],
          cons: ['Con X']
        }
      ],
      chosen_option_id: chooseFirst ? `opt_${i}_1` : `opt_${i}_2`,
      outcome: chooseFirst ? 'better' : (i % 2 === 0 ? 'better' : 'as_expected'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    testDecisions.push(decision);
  }

  // Insert decisions via direct API call
  let createdCount = 0;
  for (const decision of testDecisions) {
    try {
      const response = await fetch('http://localhost:3001/api/v1/decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: decision.title,
          description: decision.description,
          status: decision.status,
          category: decision.category,
          options: decision.options,
          chosen_option_id: decision.chosen_option_id,
          outcome: decision.outcome,
        }),
      });

      if (response.ok) {
        createdCount++;
        console.log(`✅ Created decision: ${decision.title} (chose position ${decision.chosen_option_id.endsWith('_1') ? '1' : '2'})`);
      } else {
        const error = await response.json();
        console.error(`❌ Failed to create ${decision.title}:`, error);
      }
    } catch (error) {
      console.error(`❌ Error creating ${decision.title}:`, error.message);
    }
  }

  console.log(`\n✅ Created ${createdCount}/10 test decisions`);
  console.log('\nExpected bias detection:');
  console.log('- Position 1: chosen 7 times out of 10 opportunities = 70%');
  console.log('- Position 2: chosen 3 times out of 10 opportunities = 30%');
  console.log('- Should detect: Position #1 with ~70% (Primacy bias)');
  console.log('\nTest user credentials:');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
}

testPositionBias().catch(console.error);

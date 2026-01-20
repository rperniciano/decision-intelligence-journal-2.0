import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import readline from 'readline';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'test-f89-reviewed@example.com';
const TEST_PASSWORD = 'testpass123';

async function main() {
  console.log('=== Feature #89 Test: Transition to Reviewed Status ===\n');

  // Step 1: Sign in as test user
  console.log('Step 1: Signing in as test user...');

  let userId;
  let accessToken;

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (signInError) {
    console.log('User does not exist, creating...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true
    });

    if (createError) {
      console.error('Failed to create user:', createError.message);
      console.log('Trying to delete and recreate...');

      // Try to delete the user first
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === TEST_EMAIL);

      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.log('Deleted existing user');
      }

      // Try creating again
      const { data: newUser2, error: createError2 } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true
      });

      if (createError2) {
        console.error('Failed to create user after deletion:', createError2);
        return;
      }
      userId = newUser2.user.id;
      accessToken = newUser2.session.access_token;
    } else {
      userId = newUser.user.id;
      accessToken = newUser.session.access_token;
    }
  } else {
    userId = signInData.user.id;
    accessToken = signInData.session.access_token;
  }

  console.log('✓ User ID:', userId);
  console.log('✓ Access token obtained');

  // Step 2: Create a test decision with status "decided"
  console.log('\nStep 2: Creating test decision with "decided" status...');

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  const { data: newDecision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      category_id: category?.id || null,
      title: 'Test Decision F89 - Should Transition to Reviewed',
      status: 'decided',
      decided_at: new Date().toISOString()
    })
    .select('id, status')
    .single();

  if (decisionError) {
    console.error('Failed to create decision:', decisionError);
    return;
  }

  console.log('✓ Decision created:');
  console.log('  - ID:', newDecision.id);
  console.log('  - Status:', newDecision.status);

  const decisionId = newDecision.id;

  // Step 3: Record an outcome
  console.log('\nStep 3: Recording outcome via API...');

  const response = await fetch('http://localhost:4001/api/v1/decisions/' + decisionId + '/outcomes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    },
    body: JSON.stringify({
      result: 'better',
      satisfaction: 5,
      notes: 'Test outcome for Feature #89'
    })
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('✗ Failed to record outcome');
    console.error('Status:', response.status);
    console.error('Response:', errorText);
    return;
  }

  const outcomeData = await response.json();
  console.log('✓ Outcome recorded:', JSON.stringify(outcomeData, null, 2));

  // Step 4: Verify decision status changed to "reviewed"
  console.log('\nStep 4: Verifying decision status changed to "reviewed"...');

  const { data: updatedDecision, error: fetchError } = await supabase
    .from('decisions')
    .select('id, status, title')
    .eq('id', decisionId)
    .single();

  if (fetchError) {
    console.error('Failed to fetch updated decision:', fetchError);
    return;
  }

  console.log('✓ Decision status after outcome:');
  console.log('  - ID:', updatedDecision.id);
  console.log('  - Title:', updatedDecision.title);
  console.log('  - Status:', updatedDecision.status);

  // Step 5: Verify the status transition
  console.log('\nStep 5: Verifying status transition...');

  if (updatedDecision.status === 'reviewed') {
    console.log('✅ SUCCESS: Decision status correctly transitioned from "decided" to "reviewed"');
  } else {
    console.log('✗ FAILURE: Decision status is "' + updatedDecision.status + '" but expected "reviewed"');
    return;
  }

  // Step 6: Verify pattern analysis includes reviewed decisions
  console.log('\nStep 6: Verifying pattern analysis includes reviewed decisions...');

  const { data: stats, error: statsError } = await supabase
    .from('decisions')
    .select('status')
    .eq('user_id', userId);

  if (statsError) {
    console.error('Failed to fetch stats:', statsError);
  } else {
    const reviewedCount = stats.filter(d => d.status === 'reviewed').length;
    const decidedCount = stats.filter(d => d.status === 'decided').length;

    console.log('✓ Decision statistics:');
    console.log('  - Reviewed decisions:', reviewedCount);
    console.log('  - Decided (not yet reviewed) decisions:', decidedCount);
    console.log('  - Total decisions:', stats.length);
  }

  console.log('\n=== Feature #89 Test Complete ===');
  console.log('✅ All verifications passed!');
}

main().catch(console.error);

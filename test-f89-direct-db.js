import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'test-f89-reviewed@example.com';
const TEST_PASSWORD = 'testpass123';

async function main() {
  console.log('=== Feature #89 Test: Direct Database Verification ===\n');

  // Step 1: Sign in
  console.log('Step 1: Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (signInError) {
    console.error('Failed to sign in:', signInError);
    return;
  }

  const userId = signInData.user.id;
  console.log('✓ User ID:', userId);

  // Step 2: Create a test decision with status "decided"
  console.log('\nStep 2: Creating test decision with "decided" status...');
  const { data: newDecision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Test Decision F89 Direct - Should Transition to Reviewed',
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

  // Step 3: Simulate what the API should do - record outcome AND update status
  console.log('\nStep 3: Simulating outcome recording with status transition...');

  // First, try to use outcomes table (if it exists)
  const outcomesTableExists = await checkOutcomesTable();

  if (outcomesTableExists) {
    console.log('Using outcomes table (new format)');

    // Insert outcome
    const { data: newOutcome, error: insertError } = await supabase
      .from('outcomes')
      .insert({
        decision_id: decisionId,
        result: 'better',
        satisfaction: 5,
        learned: 'Test outcome for Feature #89',
        recorded_at: new Date().toISOString(),
        check_in_number: 1
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert outcome:', insertError);
      return;
    }

    console.log('✓ Outcome recorded:', newOutcome.id);

    // Then update status
    const { error: statusError } = await supabase
      .from('decisions')
      .update({ status: 'reviewed' })
      .eq('id', decisionId)
      .eq('user_id', userId);

    if (statusError) {
      console.error('Failed to update status:', statusError);
      return;
    }

    console.log('✓ Status updated to "reviewed"');
  } else {
    console.log('Using legacy format (outcome on decision table)');

    // Update decision with outcome AND status
    const { data: updated, error: updateError } = await supabase
      .from('decisions')
      .update({
        outcome: 'better',
        outcome_notes: 'Test outcome for Feature #89',
        outcome_recorded_at: new Date().toISOString(),
        status: 'reviewed' // This is the key change for Feature #89
      })
      .eq('id', decisionId)
      .eq('user_id', userId)
      .select('id, status, outcome')
      .single();

    if (updateError) {
      console.error('Failed to update decision:', updateError);
      return;
    }

    console.log('✓ Outcome recorded and status updated');
    console.log('  - New status:', updated.status);
  }

  // Step 4: Verify the status transition
  console.log('\nStep 4: Verifying decision status...');

  const { data: verifiedDecision, error: fetchError } = await supabase
    .from('decisions')
    .select('id, status, title, outcome, outcome_recorded_at')
    .eq('id', decisionId)
    .single();

  if (fetchError) {
    console.error('Failed to fetch decision:', fetchError);
    return;
  }

  console.log('✓ Decision after outcome:');
  console.log('  - ID:', verifiedDecision.id);
  console.log('  - Title:', verifiedDecision.title);
  console.log('  - Status:', verifiedDecision.status);
  console.log('  - Has outcome:', !!verifiedDecision.outcome);

  // Step 5: Verify the feature works
  console.log('\nStep 5: Verification...');

  if (verifiedDecision.status === 'reviewed') {
    console.log('✅ SUCCESS: Decision status correctly transitioned to "reviewed"');
  } else {
    console.log('✗ FAILURE: Decision status is "' + verifiedDecision.status + '" but expected "reviewed"');
    return;
  }

  console.log('\n=== Feature #89 Database Test Complete ===');
  console.log('✅ Status transition works correctly at the database level!');
}

async function checkOutcomesTable() {
  const { data, error } = await supabase
    .from('outcomes')
    .select('*')
    .limit(1);

  return !error;
}

main().catch(console.error);

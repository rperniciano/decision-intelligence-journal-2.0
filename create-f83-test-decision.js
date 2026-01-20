/**
 * Create test decision with options for Feature #83 verification
 * Feature #83: Update decision options - verify option editing works
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestDecision() {
  console.log('Creating test decision for Feature #83...\n');

  // Get or create test user
  const testEmail = 'f83-options-test@example.com';
  const testPassword = 'test123456';

  // Check if user exists
  const { data: existingUser, error: userError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', testEmail)
    .single();

  let userId;

  if (existingUser) {
    userId = existingUser.id;
    console.log(`✅ Found existing user: ${testEmail}`);
  } else {
    console.log(`⚠️  User ${testEmail} not found in profiles`);
    console.log('Please create this user first through the signup flow');
    process.exit(1);
  }

  // Create a decision with multiple options
  const decisionData = {
    user_id: userId,
    title: 'F83_TEST_DECISION_OPTIONS',
    description: 'Test decision for Feature #83 - option editing',
    status: 'considering',
    category_id: null,
    follow_up_date: null,
    detected_emotional_state: null,
    outcome: null,
    created_at: new Date().toISOString()
  };

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert(decisionData)
    .select('id')
    .single();

  if (decisionError) {
    console.error('❌ Error creating decision:', decisionError.message);
    process.exit(1);
  }

  console.log(`✅ Created decision: ${decision.id}`);

  // Create multiple options for this decision
  const options = [
    { name: 'Option A - Keep Original', pros: 3, cons: 2 },
    { name: 'Option B - Modified Choice', pros: 2, cons: 3 },
    { name: 'Option C - To Be Deleted', pros: 1, cons: 5 },
    { name: 'Option D - Neutral Ground', pros: 2, cons: 2 }
  ];

  for (const opt of options) {
    const { error: optError } = await supabase
      .from('decision_options')
      .insert({
        decision_id: decision.id,
        name: opt.name,
        pros_count: opt.pros,
        cons_count: opt.cons,
        created_at: new Date().toISOString()
      });

    if (optError) {
      console.error(`❌ Error creating option "${opt.name}":`, optError.message);
    } else {
      console.log(`  ✅ Created option: ${opt.name}`);
    }
  }

  console.log('\n========================================');
  console.log('TEST DATA READY FOR FEATURE #83');
  console.log('========================================');
  console.log(`Decision ID: ${decision.id}`);
  console.log(`Title: F83_TEST_DECISION_OPTIONS`);
  console.log(`Options: ${options.length}`);
  console.log('\nOptions created:');
  options.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt.name} (${opt.pros} pros, ${opt.cons} cons)`);
  });
  console.log('\nTest steps:');
  console.log('  1. Rename "Option B" to "Option B - RENAMED"');
  console.log('  2. Add new option "Option E - New Addition"');
  console.log('  3. Delete "Option C - To Be Deleted"');
  console.log('  4. Save and verify all changes persist');
  console.log('========================================\n');

  return decision.id;
}

createTestDecision()
  .then(decisionId => {
    console.log(`\n✅ Test data ready! Decision ID: ${decisionId}`);
    console.log('You can now test Feature #83 in the browser.\n');
  })
  .catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });

/**
 * Create test decision for Feature #83 using an existing test user
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findExistingUserAndCreateDecision() {
  console.log('Finding existing test user...\n');

  // Try to find any user from previous tests
  const { data: users, error: usersError } = await supabase
    .from('decisions')
    .select('user_id')
    .limit(1);

  if (usersError || !users || users.length === 0) {
    console.log('⚠️  No existing users found');
    console.log('Trying auth.users directly...');

    // Try using a known test user ID from previous sessions
    const knownTestUserId = 'd7<arg_value>0cd7e-8d6d-4f3e-9a8e-4b3e9d6c2f1a'; // From previous tests

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(knownTestUserId);

    if (authError || !authUser) {
      console.log('❌ Cannot find existing user');
      console.log('\nYou need to:');
      console.log('1. Log into the app at http://localhost:5196');
      console.log('2. Create an account or login with existing user');
      console.log('3. Run this script again with that user\'s ID\n');
      process.exit(1);
    }

    var userId = knownTestUserId;
  } else {
    var userId = users[0].user_id;
  }

  console.log(`✅ Using user ID: ${userId}`);

  // Create a decision with options
  console.log('\nCreating test decision...\n');

  const decisionData = {
    user_id: userId,
    title: 'F83_TEST_DECISION_OPTIONS',
    description: 'Test decision for Feature #83 - option editing workflow',
    status: 'considering',
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

  // Create options
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
  console.log(`User ID: ${userId}`);
  console.log(`Decision ID: ${decision.id}`);
  console.log(`Title: F83_TEST_DECISION_OPTIONS`);
  console.log(`Options: ${options.length}`);
  console.log('\nTest Plan:');
  console.log('  1. Navigate to decision detail page');
  console.log('  2. Click Edit button');
  console.log('  3. Rename "Option B" → "Option B - RENAMED"');
  console.log('  4. Add new option "Option E - New Addition"');
  console.log('  5. Delete "Option C - To Be Deleted"');
  console.log('  6. Save changes');
  console.log('  7. Verify all changes persisted');
  console.log('========================================\n');

  console.log(`✅ Ready for browser testing!`);
  console.log(`   URL: http://localhost:5196/decisions/${decision.id}\n`);
}

findExistingUserAndCreateDecision()
  .then(() => {
    console.log('Test data creation complete!\n');
  })
  .catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });

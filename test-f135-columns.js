/**
 * Feature #135: Direct column test by attempting insert
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumnsByInsert() {
  console.log('Testing reminder columns by attempting insert...\n');

  // First, get a real decision and user to test with
  const { data: decisions, error: decisionError } = await supabase
    .from('decisions')
    .select('id, user_id')
    .limit(1);

  if (decisionError || !decisions || decisions.length === 0) {
    console.log('❌ No decisions found to test with');
    console.log('   Creating a test decision first...');

    // Create a test decision
    const { data: newDecision, error: createError } = await supabase
      .from('decisions')
      .insert({
        title: 'F135_SCHEMA_TEST',
        status: 'considering',
        category: 'Test',
        user_id: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000001'
      })
      .select('id, user_id')
      .single();

    if (createError) {
      console.log(`❌ Could not create test decision: ${createError.message}`);
      return false;
    }

    console.log('✅ Created test decision');
    var decisionId = newDecision.id;
    var userId = newDecision.user_id;
  } else {
    var decisionId = decisions[0].id;
    var userId = decisions[0].user_id;
  }

  console.log(`Decision ID: ${decisionId}`);
  console.log(`User ID: ${userId}\n`);

  // Now try to insert a reminder with ALL columns including remind_at and user_id
  console.log('Attempting to insert reminder with remind_at and user_id...\n');

  const testReminder = {
    decision_id: decisionId,
    user_id: userId,
    remind_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert(testReminder)
    .select();

  if (error) {
    console.log('❌ Insert FAILED');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);

    // Parse the error to understand which column is missing
    const errorMsg = error.message.toLowerCase();

    if (errorMsg.includes('remind_at')) {
      console.log('\n🔍 Diagnosis: Missing "remind_at" column');
    } else if (errorMsg.includes('user_id')) {
      console.log('\n🔍 Diagnosis: Missing "user_id" column');
    } else if (errorMsg.includes('column') || errorMsg.includes('does not exist')) {
      console.log('\n🔍 Diagnosis: Column schema issue (check error details)');
    } else {
      console.log('\n🔍 Diagnosis: Other error (see message above)');
    }

    console.log('\n❌ Feature #135 is BLOCKED by database schema');
    console.log('\nRequired Action:');
    console.log('  Run: migrations/fix-reminders-table-f101.sql');
    console.log('  In: Supabase Dashboard → SQL Editor');

    return false;
  }

  console.log('✅ Insert SUCCESSFUL!');
  console.log('\nInserted reminder:');
  console.log(`  ID: ${data[0].id}`);
  console.log(`  Decision ID: ${data[0].decision_id}`);
  console.log(`  User ID: ${data[0].user_id || 'Not set'}`);
  console.log(`  Remind At: ${data[0].remind_at || 'Not set'}`);
  console.log(`  Status: ${data[0].status}`);

  // Clean up test data
  console.log('\nCleaning up test reminder...');
  await supabase
    .from('DecisionsFollowUpReminders')
    .delete()
    .eq('id', data[0].id);

  console.log('✅ Test reminder deleted');

  // Check if the critical columns exist in the returned data
  const hasRemindAt = data[0].hasOwnProperty('remind_at');
  const hasUserId = data[0].hasOwnProperty('user_id');

  console.log('\n========================================');
  console.log('Column Check:');
  console.log(`  remind_at: ${hasRemindAt ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`  user_id: ${hasUserId ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log('========================================');

  if (hasRemindAt && hasUserId) {
    console.log('\n✅ SCHEMA IS READY for Feature #135!');
    console.log('All required columns exist in the database.');
    return true;
  } else {
    console.log('\n❌ SCHEMA IS NOT READY for Feature #135');
    console.log('\nRequired Action:');
    console.log('  Run: migrations/fix-reminders-table-f101.sql');
    console.log('  In: Supabase Dashboard → SQL Editor');
    return false;
  }
}

testColumnsByInsert()
  .then(isReady => {
    console.log('\n========================================');
    console.log(`FINAL RESULT: ${isReady ? '✅ READY' : '❌ NOT READY'}`);
    console.log('Feature #135 Status: ' + (isReady ? 'CAN PROCEED' : 'BLOCKED'));
    console.log('========================================\n');
    process.exit(isReady ? 0 : 1);
  })
  .catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });

/**
 * Feature #101 Column Check via API
 * Directly tests if columns exist by attempting to use them
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('=== Feature #101 Column Check ===\n');

  // First, get a valid decision_id to work with
  const { data: decisions, error: decisionError } = await supabase
    .from('decisions')
    .select('id')
    .limit(1);

  if (decisionError || !decisions || decisions.length === 0) {
    console.log('⚠ No decisions found, creating test data first...');

    // Create a test decision
    const { data: newDecision, error: createError } = await supabase
      .from('decisions')
      .insert({
        title: 'F101 Schema Test Decision',
        description: 'Testing if remind_at and user_id columns exist',
        category_id: null,
        status: 'pending'
      })
      .select('id')
      .single();

    if (createError) {
      console.error('❌ Failed to create test decision:', createError.message);
      return;
    }

    console.log('✓ Created test decision:', newDecision.id);
    var decisionId = newDecision.id;
  } else {
    var decisionId = decisions[0].id;
    console.log('✓ Using existing decision:', decisionId);
  }

  console.log('\nTesting column existence by attempting to insert reminder...\n');

  // Try to insert a reminder with remind_at and user_id
  const testReminder = {
    decision_id: decisionId,
    remind_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    user_id: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000',
    status: 'pending'
  };

  const { data: reminder, error: insertError } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert(testReminder)
    .select();

  if (insertError) {
    console.log('❌ Insert failed:', insertError.message);
    console.log('   Details:', insertError.details);
    console.log('   Hint:', insertError.hint);

    if (insertError.message.includes('remind_at')) {
      console.log('\n✗ CONFIRMED: Column "remind_at" does NOT exist');
      console.log('   Error: column "remind_at" does not exist\n');
    } else if (insertError.message.includes('user_id')) {
      console.log('\n✗ CONFIRMED: Column "user_id" does NOT exist');
      console.log('   Error: column "user_id" does not exist\n');
    } else {
      console.log('\n? Unknown error - column existence uncertain\n');
    }

    console.log('⚠ FEATURE #101 CANNOT WORK WITHOUT THESE COLUMNS');
    console.log('\nRequired action:');
    console.log('Run migration: apps/api/migrations/fix-reminders-table-f101.sql');
    console.log('In Supabase Dashboard: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');

  } else {
    console.log('✅ SUCCESS! Reminder inserted with all columns');
    console.log('   Columns confirmed to exist:');
    console.log('   ✓ remind_at');
    console.log('   ✓ user_id');
    console.log('\nReminder data:', reminder);

    // Clean up test data
    console.log('\nCleaning up test reminder...');
    await supabase
      .from('DecisionsFollowUpReminders')
      .delete()
      .eq('decision_id', decisionId);

    console.log('✓ Test reminder deleted');
    console.log('\n✅ FEATURE #101 SHOULD WORK! Schema is correct.');
  }

  console.log('\n=== Check Complete ===\n');
}

checkColumns();

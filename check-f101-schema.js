// Detailed check of DecisionsFollowUpReminders table schema for Feature #101
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('=== Feature #101: Reminder Table Schema Check ===\n');

  // Try to insert a test reminder to see what columns are required
  const testReminder = {
    decision_id: '00000000-0000-0000-0000-000000000000',
    user_id: '00000000-0000-0000-0000-000000000000',
    remind_at: new Date().toISOString(),
    status: 'pending'
  };

  console.log('Attempting to insert test reminder to validate schema...');
  console.log('Test data:', JSON.stringify(testReminder, null, 2));

  const { data, error } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert(testReminder)
    .select();

  if (error) {
    console.log('\n❌ Insert failed (expected for test IDs):');
    console.log('Error message:', error.message);
    console.log('Error hint:', error.hint);
    console.log('Error details:', error.details);
    console.log('\nThis error message reveals which column(s) are problematic.');

    // Check if it's a column name error
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      const match = error.message.match(/column "([^"]+)" does not exist/);
      if (match) {
        console.log(`\n⚠️  MISSING COLUMN: "${match[1]}"`);
        console.log('This is the schema mismatch blocking Feature #101.');
      }
    }
  } else {
    console.log('\n✅ Insert succeeded (unexpected for test IDs)');
    console.log('Data:', data);

    // Clean up the test record
    await supabase
      .from('DecisionsFollowUpReminders')
      .delete()
      .eq('decision_id', testReminder.decision_id);
  }

  // Try to query to see actual columns
  console.log('\n--- Attempting to query table structure ---');
  const { data: existingData, error: queryError } = await supabase
    .from('DecisionsFollowUpReminders')
    .select('*')
    .limit(1);

  if (queryError) {
    console.log('Query error:', queryError.message);
  } else if (existingData && existingData.length > 0) {
    console.log('✅ Found existing reminder');
    console.log('Columns:', Object.keys(existingData[0]).sort());
    console.log('Sample:', JSON.stringify(existingData[0], null, 2));
  } else {
    console.log('Table is empty (no existing reminders to inspect)');
  }

  // Check what the app_spec.txt says the schema should be
  console.log('\n--- Expected schema from app_spec.txt ---');
  console.log('Table: outcome_reminders');
  console.log('Expected columns:');
  console.log('  - id (UUID, PK)');
  console.log('  - decision_id (UUID, FK to decisions)');
  console.log('  - user_id (UUID, FK to profiles)');
  console.log('  - remind_at (TIMESTAMPTZ)  ← THIS IS THE MISSING COLUMN');
  console.log('  - status (VARCHAR 20: pending/sent/completed/skipped)');
  console.log('  - created_at (TIMESTAMPTZ)');

  console.log('\n=== Summary ===');
  console.log('Feature #101 requires the remind_at column for:');
  console.log('  1. Background job to find due reminders (line 91 of reminderBackgroundJob.ts)');
  console.log('  2. Storing when the reminder should be sent');
  console.log('  3. Comparing with current time to trigger notifications');
}

checkSchema().catch(console.error);

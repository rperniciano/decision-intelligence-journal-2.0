/**
 * Feature #135: Check if reminder schema columns exist
 *
 * This script tests whether the database migration for reminders has been executed.
 * Feature #135 requires: remind_at and user_id columns in DecisionsFollowUpReminders table
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReminderSchema() {
  console.log('========================================');
  console.log('Feature #135 Schema Check');
  console.log('========================================\n');

  // Try to insert a test reminder with all required columns
  const testReminder = {
    decision_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    remind_at: new Date().toISOString(),
    status: 'pending'
  };

  console.log('Testing reminder columns...');
  console.log('Required columns:');
  console.log('  - remind_at (TIMESTAMPTZ)');
  console.log('  - user_id (UUID)');
  console.log('');

  try {
    // Try to query the table structure indirectly
    const { data, error } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Query failed:');
      console.log(`   Error: ${error.message}`);
      console.log(`   Hint: ${error.hint || 'No hint available'}`);
      console.log('');
      console.log('This suggests the table structure issue.');
      return false;
    }

    // If we got here, the query succeeded
    console.log('✅ Query successful');

    // Check if data has the expected columns
    if (data && data.length > 0) {
      const sample = data[0];
      console.log('');
      console.log('Sample reminder columns:');
      Object.keys(sample).forEach(key => {
        console.log(`  - ${key}: ${typeof sample[key]}`);
      });

      const hasRemindAt = 'remind_at' in sample;
      const hasUserId = 'user_id' in sample;

      console.log('');
      console.log('Schema check:');
      console.log(`  remind_at column: ${hasRemindAt ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  user_id column: ${hasUserId ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log('');

      if (hasRemindAt && hasUserId) {
        console.log('✅ Schema is ready for Feature #135');
        return true;
      } else {
        console.log('❌ Schema is NOT ready for Feature #135');
        console.log('');
        console.log('Required: Run migrations/fix-reminders-table-f101.sql');
        console.log('Location: Supabase Dashboard → SQL Editor');
        return false;
      }
    } else {
      console.log('');
      console.log('⚠️  Table is empty, but query succeeded');
      console.log('This suggests the table exists but we cannot verify columns');
      console.log('');
      console.log('Recommendation: Try to insert a test reminder to verify schema');
      return null; // Unknown
    }
  } catch (err) {
    console.log('❌ Unexpected error:');
    console.log(`   ${err.message}`);
    return false;
  }
}

testReminderSchema()
  .then(result => {
    console.log('');
    console.log('========================================');
    if (result === true) {
      console.log('RESULT: ✅ Schema is READY');
      console.log('Feature #135 can be implemented');
    } else if (result === false) {
      console.log('RESULT: ❌ Schema is NOT READY');
      console.log('Feature #135 is blocked by database schema');
      console.log('');
      console.log('ACTION REQUIRED:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Run: migrations/fix-reminders-table-f101.sql');
      console.log('3. Verify no errors occurred');
    } else {
      console.log('RESULT: ⚠️  UNKNOWN');
      console.log('Could not definitively verify schema');
    }
    console.log('========================================');
    process.exit(result === true ? 0 : 1);
  })
  .catch(err => {
    console.error('\nFatal error:', err);
    process.exit(1);
  });

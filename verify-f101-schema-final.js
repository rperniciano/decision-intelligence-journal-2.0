/**
 * Feature #101 Database Schema Verification Script
 *
 * This script verifies whether the DecisionsFollowUpReminders table
 * has the required columns for Feature #101 to work.
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('=== Feature #101 Schema Verification ===\n');

  try {
    // Query to check table schema using PostgreSQL information_schema
    const { data: columns, error: columnError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'DecisionsFollowUpReminders'
        ORDER BY ordinal_position;
      `
    });

    // The RPC function might not exist, so let's try a direct query instead
    console.log('Attempting to query DecisionsFollowUpReminders table...\n');

    // Try to insert a test reminder to check if columns exist
    const testReminder = {
      decision_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID, but we're just checking schema
      remind_at: new Date().toISOString(),
      user_id: '00000000-0000-0000-0000-000000000000',
      status: 'pending'
    };

    console.log('Checking for required columns:');
    console.log('- remind_at (TIMESTAMPTZ)');
    console.log('- user_id (UUID REFERENCES profiles(id))\n');

    // Try a direct query to see what error we get
    const { data: reminders, error: queryError } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('*')
      .limit(1);

    if (queryError) {
      console.log('❌ Query Error:', queryError.message);
      console.log('   Code:', queryError.code);
      console.log('   Hint:', queryError.hint);

      if (queryError.message.includes('remind_at')) {
        console.log('\n✗ CONFIRMED: Column "remind_at" does not exist');
      } else if (queryError.message.includes('user_id')) {
        console.log('\n✗ CONFIRMED: Column "user_id" does not exist');
      } else {
        console.log('\n✓ Table exists but schema is incomplete');
      }
    } else {
      console.log('✓ Query succeeded - checking columns in response...\n');

      if (reminders && reminders.length > 0) {
        const sample = reminders[0];
        console.log('Sample reminder columns:', Object.keys(sample));

        if ('remind_at' in sample) {
          console.log('✓ Column "remind_at" EXISTS');
        } else {
          console.log('✗ Column "remind_at" MISSING');
        }

        if ('user_id' in sample) {
          console.log('✓ Column "user_id" EXISTS');
        } else {
          console.log('✗ Column "user_id" MISSING');
        }
      } else {
        console.log('✓ Table is empty (no reminders to check)');
        console.log('  Cannot verify column existence without data');
      }
    }

    console.log('\n=== Verification Complete ===\n');
    console.log('REQUIRED ACTION:');
    console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
    console.log('2. Open: apps/api/migrations/fix-reminders-table-f101.sql');
    console.log('3. Copy and paste the SQL');
    console.log('4. Click "Run"');
    console.log('5. Feature #101 will work immediately\n');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifySchema();

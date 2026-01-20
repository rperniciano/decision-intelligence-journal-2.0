/**
 * Comprehensive schema check for Feature #135
 * Tests if the migration has been executed
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkSchema() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Feature #135 Schema Check');
  console.log('═══════════════════════════════════════════════════════\n');

  // Try to query the table structure using PostgreSQL system tables
  const { data: columns, error: columnError } = await supabase
    .rpc('get_table_columns', { table_name: 'DecisionsFollowUpReminders' })
    .select('*');

  console.log('Check 1: Direct column access test');
  console.log('────────────────────────────────────');

  // Try to insert a test record
  const testReminder = {
    decision_id: '00000000-0000-0000-0000-000000000001',
    remind_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    status: 'pending'
  };

  console.log('Attempting to insert test reminder...');
  const { data: insertData, error: insertError } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert(testReminder)
    .select()
    .single();

  if (insertError) {
    console.log('❌ Insert failed');
    console.log(`Error: ${insertError.message}`);
    console.log(`Code: ${insertError.code}\n`);

    if (insertError.message.includes('remind_at')) {
      console.log('⚠️  BLOCKER CONFIRMED: remind_at column missing');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Migration Status: NOT EXECUTED');
      console.log('═══════════════════════════════════════════════════════');
      console.log('\nTo fix this, execute the migration at:');
      console.log('apps/api/migrations/fix-reminders-table-f101.sql\n');
      console.log('Via Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
      process.exit(1);
    }
  } else {
    console.log('✅ Insert successful!');

    const hasRemindAt = 'remind_at' in insertData;
    const hasUserId = 'user_id' in insertData;

    console.log('\nSchema check:');
    console.log(`  remind_at column: ${hasRemindAt ? '✅' : '❌'}`);
    console.log(`  user_id column: ${hasUserId ? '✅' : '❌'}`);

    // Clean up test data
    await supabase
      .from('DecisionsFollowUpReminders')
      .delete()
      .eq('decision_id', testReminder.decision_id);

    console.log('\n✅ Test data cleaned up');

    if (hasRemindAt && hasUserId) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('✅ MIGRATION EXECUTED - Schema is ready!');
      console.log('═══════════════════════════════════════════════════════');
      console.log('\nFeature #135 can now proceed with implementation!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Partial migration - some columns missing');
      process.exit(1);
    }
  }
}

checkSchema();

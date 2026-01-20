// ============================================================================
// Feature #135 - Session 5: Schema Verification
// ============================================================================
// Check if the database migration has been executed
//
// This script verifies whether the columns 'remind_at' and 'user_id' exist
// in the DecisionsFollowUpReminders table.
//
// If these columns exist, the migration was executed and Feature #135 can proceed.
// If not, Feature #135 remains blocked until the migration is run manually.
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('================================================================================');
  console.log('Feature #135 - Session 5: Database Schema Check');
  console.log('================================================================================\n');

  try {
    // Method 1: Try to query the table (will fail if columns missing)
    console.log('🔍 Method 1: Direct table query test');
    console.log('-------------------------------------------');

    const { data, error, status } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('id, decision_id, remind_at, user_id, status, created_at')
      .limit(1);

    if (error) {
      console.log('❌ Query failed with error:');
      console.log('   Status:', status);
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Hints:', error.hints);

      if (error.code === 'PGRST204' && error.message.includes('remind_at')) {
        console.log('\n⚠️  DIAGNOSIS: Column "remind_at" does not exist');
        console.log('   Migration has NOT been executed\n');
      }
    } else {
      console.log('✅ Query successful!');
      console.log('   Columns "remind_at" and "user_id" exist');
      console.log('   Migration HAS been executed\n');

      if (data && data.length > 0) {
        console.log('📊 Sample data:');
        console.log('  ', JSON.stringify(data[0], null, 2));
      } else {
        console.log('   (Table is empty - no reminders created yet)');
      }
    }

    // Method 2: Try RPC to check schema (if available)
    console.log('\n🔍 Method 2: Information schema query');
    console.log('-------------------------------------------');

    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'DecisionsFollowUpReminders' })
      .select('column_name, data_type')
      .order('ordinal_position');

    if (schemaError) {
      console.log('ℹ️  RPC function not available:', schemaError.message);
      console.log('   (This is expected - Supabase doesn\'t expose this by default)\n');
    } else {
      console.log('✅ Schema query successful:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
      console.log();
    }

    // Final verdict
    console.log('================================================================================');
    console.log('FINAL VERDICT');
    console.log('================================================================================\n');

    if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message.includes('does not exist'))) {
      console.log('❌ MIGRATION NOT EXECUTED');
      console.log('\nThe required columns are missing from the database.');
      console.log('\nREQUIRED ACTION:');
      console.log('1. Go to: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
      console.log('2. Copy contents of: apps/api/migrations/fix-reminders-table-f101.sql');
      console.log('3. Paste into SQL Editor');
      console.log('4. Click "Run" button');
      console.log('5. Verify no errors');
      console.log('\nEstimated time: 2-3 minutes');
      console.log('\nAfter migration:');
      console.log('- Feature #101 will work immediately');
      console.log('- Feature #135 will work immediately');
      console.log('- Feature #201 will work immediately');
    } else if (!error) {
      console.log('✅ MIGRATION EXECUTED');
      console.log('\nThe database schema is up to date!');
      console.log('\nNEXT STEPS:');
      console.log('- Feature #135 can now be tested via browser automation');
      console.log('- All reminder endpoints should work correctly');
      console.log('- Background job will process reminders properly');
    } else {
      console.log('⚠️  UNEXPECTED ERROR');
      console.log('\nUnexpected database error. Manual investigation needed.');
      console.log('Error:', error);
    }

    console.log('\n================================================================================\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

checkSchema();

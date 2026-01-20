// ============================================================================
// Feature #135 Session 6: Verify if migration has been executed
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
  console.log('Feature #135 Session 6: Database Schema Check');
  console.log('================================================================================\n');

  try {
    // Check if remind_at column exists
    console.log('1. Checking for remind_at column...');
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: 'DecisionsFollowUpReminders'
    }).catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (columnsError || !columns) {
      // Fallback: Try to query the table and check for the column
      const { data: testData, error: testError } = await supabase
        .from('DecisionsFollowUpReminders')
        .select('id, decision_id, remind_at, user_id, status, created_at')
        .limit(1);

      if (testError && testError.message.includes('remind_at')) {
        console.log('   ❌ remind_at column DOES NOT exist');
        console.log(`   Error: ${testError.message}`);
        console.log('\n   ❌ Migration has NOT been executed since Session 5');
        return false;
      } else if (testError) {
        console.log('   ⚠️  Could not verify column (other error)');
        console.log(`   Error: ${testError.message}`);
        return false;
      } else {
        console.log('   ✅ remind_at column EXISTS!');
        console.log('   ✅ Migration appears to have been executed');
        return true;
      }
    }

    // Check if user_id column exists
    console.log('\n2. Checking for user_id column...');
    const { data: testData2, error: testError2 } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('user_id')
      .limit(1);

    if (testError2 && testError2.message.includes('user_id')) {
      console.log('   ❌ user_id column DOES NOT exist');
      console.log('\n   ❌ Migration has NOT been executed');
      return false;
    } else if (testError2) {
      console.log('   ⚠️  Could not verify user_id column');
      return false;
    } else {
      console.log('   ✅ user_id column EXISTS!');
    }

    console.log('\n✅ SUCCESS: Both required columns exist');
    console.log('✅ Migration appears to have been executed');
    return true;

  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    return false;
  }
}

checkSchema().then(success => {
  console.log('\n================================================================================');
  if (success) {
    console.log('RESULT: ✅ Migration executed - Feature #135 ready for testing');
    console.log('================================================================================');
    process.exit(0);
  } else {
    console.log('RESULT: ❌ Migration NOT executed - Feature #135 still blocked');
    console.log('================================================================================');
    console.log('\nTO UNBLOCK: Run migration in Supabase Dashboard');
    console.log('URL: https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
    console.log('File: apps/api/migrations/fix-reminders-table-f101.sql');
    console.log('');
    process.exit(1);
  }
});

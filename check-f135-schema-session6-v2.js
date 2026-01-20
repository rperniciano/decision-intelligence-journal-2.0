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
    // Try to query the table with both columns
    console.log('Checking for remind_at and user_id columns...');
    const { data: testData, error: testError } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('id, decision_id, remind_at, user_id, status, created_at')
      .limit(1);

    if (testError) {
      console.log('❌ Error querying DecisionsFollowUpReminders table');
      console.log(`Error: ${testError.message}`);
      console.log('\n❌ Migration has NOT been executed');
      return false;
    }

    // Check if remind_at is in the returned data
    if (testData.length > 0) {
      const firstRow = testData[0];
      if ('remind_at' in firstRow && 'user_id' in firstRow) {
        console.log('✅ remind_at column EXISTS!');
        console.log('✅ user_id column EXISTS!');
        console.log('\n✅ SUCCESS: Both required columns exist');
        console.log('✅ Migration appears to have been executed');
        return true;
      }
    }

    // If no rows, we can't tell from data - try an insert test
    console.log('⚠️  Table is empty, cannot verify from data');
    console.log('Attempting direct schema check via PostgreSQL...');

    // Use raw SQL via the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        query: `
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = 'DecisionsFollowUpReminders'
          AND column_name IN ('remind_at', 'user_id')
          ORDER BY column_name;
        `
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Schema query result:', result);
      return true;
    } else {
      console.log('Could not verify schema via REST API');
      return false;
    }

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

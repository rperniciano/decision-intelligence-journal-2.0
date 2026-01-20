// ============================================================================
// Feature #135: Find which table has remind_at column
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findCorrectTable() {
  console.log('================================================================================');
  console.log('Feature #135: Find Table with remind_at Column');
  console.log('================================================================================\n');

  const tables = [
    'DecisionsFollowUpReminders',
    'outcome_reminders',
    'decisions_follow_up_reminders',
    'follow_up_reminders',
    'reminders'
  ];

  const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
  const testDecisionId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID

  console.log('Testing which table accepts remind_at column...\n');

  for (const tableName of tables) {
    console.log(`🔍 ${tableName}`);
    console.log('-------------------------------------------');

    // Try to query with remind_at
    const { data: queryData, error: queryError } = await supabase
      .from(tableName)
      .select('id, remind_at, user_id, decision_id, status, created_at')
      .limit(1);

    if (queryError) {
      if (queryError.code === '42703') {
        console.log(`   ❌ Missing column: ${queryError.message}`);

        // Try to see what columns it DOES have
        const { data: allData } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (allData && allData.length > 0) {
          console.log(`   📊 Has columns: ${Object.keys(allData[0]).join(', ')}`);
        }
      } else {
        console.log(`   ❌ Error: ${queryError.message}`);
      }
    } else {
      console.log(`   ✅ HAS remind_at column!`);

      if (queryData && queryData.length > 0) {
        console.log(`   📊 Schema looks good`);
      } else {
        console.log(`   📭 Table is empty`);
      }
    }

    console.log();
  }

  console.log('================================================================================');
  console.log('CONCLUSION');
  console.log('================================================================================\n');

  console.log('Summary:\n');

  for (const tableName of tables) {
    const { error } = await supabase
      .from(tableName)
      .select('remind_at')
      .limit(1);

    if (!error) {
      console.log(`✅ ${tableName} - HAS remind_at column`);
    } else if (error.code === '42703') {
      console.log(`❌ ${tableName} - MISSING remind_at column`);
    } else {
      console.log(`⚠️  ${tableName} - Unknown error: ${error.message.substring(0, 50)}`);
    }
  }

  console.log('\n================================================================================\n');
}

findCorrectTable();

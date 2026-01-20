// ============================================================================
// Feature #135: Check ALL possible reminder tables
// ============================================================================
// The app_spec.txt says the table should be named "outcome_reminders"
// But the code uses "DecisionsFollowUpReminders"
// Let's check which tables actually exist!
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  console.log('================================================================================');
  console.log('Feature #135: Check All Reminder Tables');
  console.log('================================================================================\n');

  const possibleTables = [
    'DecisionsFollowUpReminders',
    'outcome_reminders',
    'decisions_follow_up_reminders',
    'follow_up_reminders',
    'reminders'
  ];

  for (const tableName of possibleTables) {
    console.log(`🔍 Checking table: ${tableName}`);
    console.log('-------------------------------------------');

    try {
      const { data, error, status, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ Does not exist or error: ${error.message.substring(0, 60)}...`);
      } else {
        console.log(`   ✅ EXISTS! Count: ${count} records`);

        // Try to get a sample record to see columns
        const { data: sample, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!sampleError && sample && sample.length > 0) {
          console.log(`   📊 Columns: ${Object.keys(sample[0]).join(', ')}`);
        } else if (sampleError && sampleError.code === '42703') {
          console.log(`   ⚠️  Table exists but select failed (column issue?)`);
        } else {
          console.log(`   📭 Table is empty (can't inspect columns)`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message.substring(0, 60)}...`);
    }

    console.log();
  }

  console.log('================================================================================');
  console.log('SUMMARY');
  console.log('================================================================================\n');
  console.log('Checking which tables exist in the database...\n');

  let foundCount = 0;
  for (const tableName of possibleTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log(`✅ ${tableName}`);
        foundCount++;
      }
    } catch (err) {
      // Ignore
    }
  }

  if (foundCount === 0) {
    console.log('❌ No reminder tables found!');
    console.log('\nThis means the table needs to be created from scratch.');
  } else {
    console.log(`\nFound ${foundCount} reminder table(s).`);
  }

  console.log('\n================================================================================\n');
}

checkAllTables();

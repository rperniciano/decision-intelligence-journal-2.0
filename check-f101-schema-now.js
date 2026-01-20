// Quick check for Feature #101 schema columns
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('=== Feature #101: Check if migration was executed ===\n');

  try {
    // Check if remind_at column exists by attempting a query
    const { data, error } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('remind_at, user_id')
      .limit(1);

    if (error) {
      console.log('❌ Migration NOT executed');
      console.log('Error:', error.message);
      console.log('\nThe migration must be executed manually in Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
      console.log('\nRun the SQL from: migrations/fix-reminders-table-f101.sql');
      process.exit(1);
    }

    console.log('✅ Migration EXECUTED successfully!');
    console.log('Columns remind_at and user_id exist in DecisionsFollowUpReminders table');
    console.log('\nFeature #101 can now be tested and marked as PASSING ✅');

  } catch (err) {
    console.log('❌ Error checking schema:', err.message);
  }
}

checkSchema();

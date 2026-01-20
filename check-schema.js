const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('Checking if remind_at and user_id columns exist...\n');

  // Try to query the table to see if columns exist
  // This will fail if columns don't exist
  try {
    const { data, error } = await supabase
      .from('DecisionsFollowUpReminders')
      .select('id, remind_at, user_id')
      .limit(1);

    if (error) {
      console.log('❌ Columns do not exist yet:');
      console.log('   ', error.message);
      console.log('\n✅ This confirms the migration needs to be run.\n');
      return false;
    }

    console.log('✅ Columns exist! Migration has been executed.');
    console.log('Data sample:', data);
    return true;
  } catch (err) {
    console.log('❌ Error checking schema:', err.message);
    return false;
  }
}

checkSchema().then(exists => {
  process.exit(exists ? 0 : 1);
});

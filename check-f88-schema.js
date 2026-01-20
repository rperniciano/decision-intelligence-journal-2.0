const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('Checking if abandon_reason and abandon_note columns exist...\n');

  try {
    // Try to query these columns
    const { data, error } = await supabase
      .from('decisions')
      .select('id,abandon_reason,abandon_note')
      .limit(1);

    if (error) {
      console.log('❌ Columns DO NOT exist');
      console.log('Error:', error.message);
      console.log('\nMigration needs to be executed.');
      process.exit(1);
    }

    console.log('✅ Columns EXIST');
    console.log('Feature #88 can be tested!');
    process.exit(0);
  } catch (err) {
    console.log('❌ Error checking schema:', err.message);
    process.exit(1);
  }
}

checkSchema();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDecisionsTableSchema() {
  console.log('Checking decisions table schema...\n');

  // Try to select a row to see the schema
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error querying decisions table:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Decisions table exists!');
    console.log('\nColumns found:', Object.keys(data[0]).join(', '));
    console.log('\nSample row:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('✅ Decisions table exists but is empty');
  }
}

checkDecisionsTableSchema();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkOutcomesTable() {
  console.log('Checking if outcomes table exists...\n');

  const { data, error } = await supabase
    .from('outcomes')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Outcomes table check failed:', error.message);
    console.log('Error code:', error.code);
    console.log('\nThis means the outcomes table does not exist yet.');
    console.log('Feature #61 requires the outcomes table to be created.');
    return false;
  }

  console.log('✅ Outcomes table exists!');
  console.log('Sample data:', data);
  return true;
}

checkOutcomesTable()
  .then(result => {
    if (result === false) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

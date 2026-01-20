const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkStatuses() {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, status')
    .limit(10);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Sample decisions:');
  const statuses = new Set();
  data.forEach(decision => {
    statuses.add(decision.status);
    console.log('- ID:', decision.id, 'Title:', decision.title, 'Status:', decision.status);
  });
  console.log('\nUnique statuses found:', Array.from(statuses));
}

checkStatuses();

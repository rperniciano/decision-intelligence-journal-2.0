const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDeliberatingDecisions() {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, user_id, title, status')
    .eq('status', 'deliberating')
    .limit(5);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Found', data?.length || 0, 'deliberating decisions');
  if (data && data.length > 0) {
    data.forEach(decision => {
      console.log('- ID:', decision.id);
      console.log('  Title:', decision.title);
      console.log('  User:', decision.user_id);
    });
  }
}

checkDeliberatingDecisions();

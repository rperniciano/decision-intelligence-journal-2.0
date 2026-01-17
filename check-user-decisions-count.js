const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecisions() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51';

  const { data, error } = await supabase
    .from('decisions')
    .select('id, title')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Active decisions:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('Sample titles:', data.map(d => d.title));
  }
}

checkDecisions();

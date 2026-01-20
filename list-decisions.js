const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function listDecisions() {
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, status')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Existing decisions:');
  decisions.forEach(d => {
    console.log(`  - ${d.id}: ${d.title} (${d.status})`);
  });
}

listDecisions().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUserDecisions() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51'; // session35test@example.com

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, status, deleted_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total decisions for user: ${decisions.length}`);
  console.log('\nActive decisions (not deleted):');
  const active = decisions.filter(d => !d.deleted_at);
  console.log(`Count: ${active.length}`);
  active.slice(0, 10).forEach(d => {
    console.log(`  - ${d.title} (${d.status}) - ${d.created_at}`);
  });

  console.log('\nDeleted decisions:');
  const deleted = decisions.filter(d => d.deleted_at);
  console.log(`Count: ${deleted.length}`);
}

checkUserDecisions();

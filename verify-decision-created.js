const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  // Get session30test user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'session30test@example.com');

  console.log('User ID:', user.id);

  const { data: decisions } = await supabase
    .from('decisions')
    .select('id, title, user_id, deleted_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\nDecisions for session30test:');
  decisions.forEach(d => {
    console.log(`- ${d.title} (${d.id}) - deleted_at: ${d.deleted_at}`);
  });
}

verify();

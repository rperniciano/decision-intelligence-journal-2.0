require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: user } = await supabase.auth.admin.listUsers();
  const session35User = user.users.find(u => u.email === 'session35test@example.com');
  if (!session35User) {
    console.log('User not found');
    return;
  }

  console.log('User ID:', session35User.id);

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, status, deleted_at, created_at')
    .eq('user_id', session35User.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('\nDecisions for session35test@example.com:');
    console.log(JSON.stringify(decisions, null, 2));
    console.log(`\nTotal: ${decisions.length} decisions`);
  }
})();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getDecisions() {
  // Get user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === 'test_f277@example.com');

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('User ID:', user.id);

  const { data, error } = await supabase
    .from('decisions')
    .select('id, title')
    .eq('user_id', user.id)
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Decisions:');
    data.forEach(d => console.log(`  ${d.id}: ${d.title}`));
  }
}

getDecisions();

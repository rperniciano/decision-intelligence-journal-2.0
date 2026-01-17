const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Get the user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === 'mobiletest@example.com');
  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('User ID:', user.id);

  // Check decisions
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Decisions:', JSON.stringify(decisions, null, 2));
})();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log('Total users:', users.length);
  users.slice(0, 5).forEach(u => {
    console.log('Email:', u.email, 'ID:', u.id);
  });
})();

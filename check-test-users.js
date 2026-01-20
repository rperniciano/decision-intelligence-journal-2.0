const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkUsers() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUsers = users.filter(u => u.email.includes('test') || u.email.includes('example'));

  console.log('Test users found:');
  testUsers.slice(0, 5).forEach(u => {
    console.log(u.email);
  });
}

checkUsers();

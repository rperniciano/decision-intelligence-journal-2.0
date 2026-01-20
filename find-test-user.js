const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAnyTestUser() {
  // List recent users from auth
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data && data.users && data.users.length > 0) {
    const user = data.users[0];
    console.log('Found user:', user.email);
    console.log('ID:', user.id);
    console.log('Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
  } else {
    console.log('No users found');
  }
}

findAnyTestUser();

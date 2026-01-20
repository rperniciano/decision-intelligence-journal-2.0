const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findConfirmedUser() {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data && data.users && data.users.length > 0) {
    console.log('All users:');
    data.users.forEach(u => {
      const confirmed = u.email_confirmed_at ? '✓' : '✗';
      console.log(`  [${confirmed}] ${u.email}`);
    });

    // Find first confirmed user
    const confirmedUser = data.users.find(u => u.email_confirmed_at);
    if (confirmedUser) {
      console.log('\nFirst confirmed user:', confirmedUser.email);
    }
  } else {
    console.log('No users found');
  }
}

findConfirmedUser();

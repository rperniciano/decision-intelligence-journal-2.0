const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getExistingUser() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error || !users || users.length === 0) {
    console.log('No users found');
    return;
  }

  const user = users[0];
  console.log('Email:', user.email);
  console.log('ID:', user.id);
}

getExistingUser();

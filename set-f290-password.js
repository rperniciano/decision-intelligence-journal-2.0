const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setPassword() {
  const email = 'f290-test-1768885273148@example.com';
  const password = 'Test123456';

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password }
  );

  if (error) {
    console.error('Error setting password:', error.message);
  } else {
    console.log('✅ Password set for', email);
    console.log('Password:', password);
  }
}

setPassword();

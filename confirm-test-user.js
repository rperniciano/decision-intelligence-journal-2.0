const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmUser() {
  const email = 'audio-test-f125@example.com';
  const password = 'TestPass123!';

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error('User not found');
    return;
  }

  // Confirm email and set password
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
    password: password
  });

  if (error) {
    console.error('Error updating user:', error);
  } else {
    console.log('User confirmed and password set successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

confirmUser();

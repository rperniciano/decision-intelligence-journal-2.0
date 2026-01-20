const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

// Use service role key to bypass email confirmation
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function confirmUser() {
  const email = 'test-f10-logout@example.com';

  console.log('Attempting to confirm user:', email);

  // Try to get the user
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Found user:', user.id);
  console.log('Email confirmed:', user.email_confirmed_at);

  // Update user to confirm email
  const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    console.error('Error confirming user:', updateError.message);
  } else {
    console.log('User confirmed successfully!');
    console.log('You can now log in with:', email, '/ TestPassword123!');
  }
}

confirmUser().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmUser() {
  const email = 'test-f80-1768914878@example.com';

  // Get the user by email
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found:', email);
    return;
  }

  console.log('Found user:', user.id);

  // Update user to confirm email
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    console.error('Error confirming user:', updateError);
  } else {
    console.log('User confirmed successfully!');
  }
}

confirmUser();

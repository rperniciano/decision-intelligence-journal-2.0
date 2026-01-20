const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function resetPassword() {
  const email = 'test-f10-logout@example.com';
  const newPassword = 'TestPassword123!';

  console.log('Resetting password for:', email);

  // Get the user
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

  // Update user password
  const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('Error resetting password:', updateError.message);
  } else {
    console.log('Password reset successfully!');
    console.log('You can now log in with:', email, '/', newPassword);
  }
}

resetPassword().catch(console.error);

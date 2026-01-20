const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setUserPassword() {
  const userEmail = 'f118-duplicate-test-1769025302@example.com';
  const newPassword = 'TestPassword123!';

  console.log('Setting password for:', userEmail);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === userEmail);

  if (!user) {
    console.error('User not found:', userEmail);
    return;
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('❌ Error updating password:', updateError.message);
    return;
  }

  console.log('✅ Password updated successfully');
  console.log('Email:', userEmail);
  console.log('Password:', newPassword);
}

setUserPassword().catch(console.error);

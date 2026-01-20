const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestUser() {
  const email = `test-f189-${Date.now()}@example.com`;
  const password = 'Test1234!';

  console.log('Creating test user...');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('User created:', email);
  console.log('Password:', password);
  console.log('User ID:', data.user.id);

  // Try to confirm email via admin API
  try {
    const adminClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await adminClient.auth.admin.updateUserById(data.user.id, {
      email_confirm: true
    });
    console.log('Email confirmed!');
  } catch (e) {
    console.log('Note: Could not auto-confirm email. User may need to check email.');
  }

  return { email, password, userId: data.user.id };
}

createTestUser().catch(console.error);

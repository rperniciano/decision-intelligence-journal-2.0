const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestUser() {
  const email = `f290-test-${Date.now()}@example.com`;
  const password = 'Test123456';

  console.log('Creating test user:', email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return;
  }

  console.log('✅ User created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);

  // Auto-confirm by setting email_confirmed_at
  if (data.user) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq('id', data.user.id);

    if (updateError) {
      console.log('Note: Could not auto-confirm email, user may need to confirm email first');
    } else {
      console.log('✅ Email auto-confirmed');
    }
  }
}

createTestUser();

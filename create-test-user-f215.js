const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestUser() {
  const email = `f215test_${Date.now()}@example.com`;
  const password = 'test123456';

  console.log('Creating test user:', email);

  // Create user with auto-confirm (bypass email)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'F215 Test User'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('User created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', data.user.id);
  console.log('Session:', data.session ? 'Active' : 'None (email confirmation required)');

  if (data.session) {
    console.log('\nAccess Token:', data.session.access_token);
  }
}

createTestUser().catch(console.error);

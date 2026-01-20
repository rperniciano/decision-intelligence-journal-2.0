const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const email = 'f113-test@example.com';
  const password = 'test123456';

  console.log('Creating test user for Feature #113 (Offline recording with IndexedDB)...');

  try {
    // Create user with Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      // User might already exist, try to sign in
      console.log('User might already exist, checking...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      console.log('✅ Test user already exists and logged in');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }

    if (signUpData.user) {
      console.log('✅ Test user created successfully');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('User ID:', signUpData.user.id);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();

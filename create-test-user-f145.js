const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function createTestUser() {
  const email = 'test_f145@example.com';
  const password = 'Test1234!';

  // Try to create user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    // User might already exist, try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log('Error:', signInError.message);
    } else {
      console.log('User exists, signed in successfully');
      console.log('Session:', signInData.session.access_token.substring(0, 20) + '...');
    }
  } else {
    console.log('User created successfully');
    console.log('Session:', data.session.access_token.substring(0, 20) + '...');
  }
}

createTestUser();

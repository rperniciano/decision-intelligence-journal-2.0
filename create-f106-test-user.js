const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function createTestUser() {
  const email = 'test-f106@example.com';
  const password = 'Test123!';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'F106 Test User'
      }
    }
  });

  if (error) {
    console.log('Error:', error.message);
    // User might already exist, try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      console.log('SignIn Error:', signInError.message);
      process.exit(1);
    }
    console.log('User logged in successfully');
    console.log('Email:', email);
    console.log('Password:', password);
  } else {
    console.log('User created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

createTestUser();

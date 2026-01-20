const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables manually
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function createTestUser() {
  const email = 'test_f253@example.com';
  const password = 'Test1234!';

  console.log(`Creating test user: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'Feature 253 Test User'
      }
    }
  });

  if (error) {
    console.error('Error:', error.message);
    // Check if user already exists
    if (error.message.includes('already') || error.message.includes('registered')) {
      console.log('User already exists, attempting to sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        console.error('Sign in also failed:', signInError.message);
      } else {
        console.log('✓ User signed in successfully');
        console.log('User ID:', signInData.user.id);
      }
    }
  } else {
    console.log('✓ User created successfully');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
  }
}

createTestUser();

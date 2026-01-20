import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Test common credentials
const credentials = [
  { email: 'test@example.com', password: 'test1234' },
  { email: 'test@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'admin123' },
];

async function testLogin() {
  for (const cred of credentials) {
    const { data, error } = await supabase.auth.signInWithPassword(cred);

    if (!error && data.session) {
      console.log('Login successful!');
      console.log('  Email:', cred.email);
      console.log('  Access Token (first 50 chars):', data.session.access_token.substring(0, 50) + '...');
      return;
    }
  }

  console.log('No valid credentials found. Testing user creation...');
  // Try to create a test user
  const { data, error } = await supabase.auth.signUp({
    email: 'testf149login@example.com',
    password: 'password123'
  });

  if (error) {
    console.log('Signup error:', error.message);
  } else {
    console.log('User created:', data.user?.email);
    console.log('Note: Email confirmation required');
  }
}

testLogin();

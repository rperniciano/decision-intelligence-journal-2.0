const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyLogin() {
  const email = 'test_f277@example.com';
  const password = 'test123456';

  console.log('Attempting login with:', email);
  console.log('Password:', password);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login failed:', error.message);
    console.error('Error details:', error);
  } else {
    console.log('Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Session expires:', new Date(data.session.expires_at * 1000));
  }
}

verifyLogin().catch(console.error);

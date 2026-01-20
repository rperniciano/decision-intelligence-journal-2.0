const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testAPI() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Login
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test-f189-1768925342405@example.com',
    password: 'Test1234!',
  });

  if (signInError) {
    console.error('Login error:', signInError);
    return;
  }

  const token = signInData.session.access_token;

  // Get decisions
  const response = await fetch('http://localhost:4001/api/v1/decisions?limit=10', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Response:', text.substring(0, 500));
}

testAPI().catch(console.error);

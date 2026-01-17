const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAPI() {
  // Login as session24test
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'session24test@example.com',
    password: 'testpass123'
  });

  if (authError) {
    console.log('Auth error:', authError);
    return;
  }

  const token = authData.session.access_token;

  // Call decision detail API
  const response = await fetch('http://localhost:3001/api/v1/decisions/2d486351-1bda-4f54-96df-de58edc33072', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log('API Response:', JSON.stringify(data, null, 2));
}

testAPI();

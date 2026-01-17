const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAPI() {
  // Sign in
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'session35test@example.com',
    password: 'password123'
  });

  const token = authData.session.access_token;

  // Call API
  const response = await fetch('http://localhost:3001/api/v1/decisions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log('API Response:', JSON.stringify(data, null, 2));
  console.log('Decision count:', data.decisions?.length || 0);
}

testAPI();

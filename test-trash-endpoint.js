const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testTrashEndpoint() {
  // Sign in first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'session35test@example.com',
    password: 'password123',
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const token = authData.session.access_token;

  // Call trash endpoint
  const response = await fetch('http://localhost:3001/api/v1/decisions/trash', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log('Trash endpoint response:', JSON.stringify(data, null, 2));
}

testTrashEndpoint();

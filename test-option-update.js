const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testOptionUpdate() {
  // Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'session30test@example.com',
    password: 'password123'
  });

  if (error) {
    console.error('Login error:', error);
    return;
  }

  const token = data.session.access_token;
  console.log('Got token');

  // Try to update option
  const optionId = '165583f4-8b2c-493b-bc84-3fd0f6af8e93';

  const response = await fetch(`http://localhost:3001/api/v1/options/${optionId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Test Updated Option',
    }),
  });

  console.log('Response status:', response.status);
  const result = await response.json();
  console.log('Response:', result);
}

testOptionUpdate();

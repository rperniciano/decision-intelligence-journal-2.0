const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = 'aed0f408-9e46-44a7-954f-cb668279a940';
const optionId = '300cd0ab-8cf5-4b05-93a1-d737c6cbc0b5'; // Option Alpha

async function testAddProAPI() {
  // Get auth token
  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'session34test@example.com',
    password: 'TestPassword123!'
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const token = session.access_token;

  // Try to add a pro via the API
  const response = await fetch(`${process.env.VITE_API_URL}/options/${optionId}/pros-cons`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'pro',
      content: 'NEW Pro added via API - Session 34'
    }),
  });

  console.log('Response status:', response.status);

  if (response.ok) {
    const data = await response.json();
    console.log('Success! New pro created:');
    console.log('  ID:', data.id);
    console.log('  Content:', data.content);
    console.log('  Type:', data.type);
  } else {
    const error = await response.text();
    console.log('Error:', error);
  }
}

testAddProAPI();

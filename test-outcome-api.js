const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  // Sign in as session72test
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'session72test@example.com',
    password: 'testpass123'
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  console.log('Logged in as:', authData.user.email);
  console.log('User ID:', authData.user.id);
  console.log('Token:', authData.session.access_token.substring(0, 50) + '...');

  // Call the outcomes endpoint
  const response = await fetch('http://localhost:3001/api/v1/decisions/b1393d26-b218-4b8e-80b2-701051c3686f/outcomes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      result: 'better',
      satisfaction: 4,
      notes: 'Test from script'
    }),
  });

  console.log('Response status:', response.status);
  const data = await response.json();
  console.log('Response data:', JSON.stringify(data, null, 2));
})();

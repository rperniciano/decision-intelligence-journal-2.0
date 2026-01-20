const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createDecision() {
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

  // Create decision
  const response = await fetch('http://localhost:4001/api/v1/decisions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Test Decision F189 - First Recording',
      description: 'Testing recording state reset feature',
      status: 'decided',
      outcome: 'as_expected',
    }),
  });

  const data = await response.json();
  console.log('Decision created:', data.id);

  return data.id;
}

createDecision().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_URL = 'http://localhost:4013';

async function addNewDecision() {
  // First sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'feature267@test.com',
    password: 'test123456',
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const token = authData.session.access_token;

  // Create a new decision
  const response = await fetch(`${API_URL}/api/v1/decisions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `DECISION_DURING_TEST_${Date.now()}`,
      category: 'Career',
      status: 'decided',
      options: [
        { text: 'Option A', isChosen: false },
        { text: 'Option B', isChosen: true },
      ],
    }),
  });

  if (response.ok) {
    const decision = await response.json();
    console.log('Created new decision:', decision.title);
    console.log('ID:', decision.id);
    console.log('Created at:', decision.created_at);
  } else {
    console.error('Failed to create decision');
    console.error('Status:', response.status);
    const errorText = await response.text();
    console.error('Error:', errorText);
  }
}

addNewDecision();

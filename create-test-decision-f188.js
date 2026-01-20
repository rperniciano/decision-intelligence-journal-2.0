const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

async function createTestDecision() {
  // First, get the session token by logging in
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test-f188@example.com',
    password: 'Test1234!',
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const token = authData.session.access_token;

  // Create a test decision
  const response = await fetch('http://localhost:3001/api/v1/decisions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Test Decision for Feature #188 - Voice Reflection',
      status: 'decided',
      category: 'Testing',
      options: [
        {
          text: 'Option A',
          pros: ['Pro 1', 'Pro 2'],
          cons: ['Con 1'],
        },
        {
          text: 'Option B',
          pros: ['Pro 3'],
          cons: ['Con 2', 'Con 3'],
        }
      ],
      chosen_option_id: null, // Will be set by API
      emotional_state: 'Confident',
    }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Test decision created successfully!');
    console.log('Decision ID:', data.id);
    console.log('Title:', data.title);
  } else {
    console.error('Failed to create decision:', await response.text());
  }
}

createTestDecision();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

(async () => {
  // Sign in to get token
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'session27test@example.com',
    password: 'password123'
  });

  const token = authData.session.access_token;

  // Fetch decision from API
  const response = await fetch(`http://localhost:3001/api/v1/decisions/5c36a629-0924-4d5c-9aab-53c44487d696`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const decision = await response.json();
  console.log('API Response:');
  console.log(JSON.stringify(decision, null, 2));

  // Check if emotional_state exists
  if (decision.detected_emotional_state) {
    console.log('\n✓ Field name: detected_emotional_state');
    console.log('Value:', decision.detected_emotional_state);
  }
  if (decision.emotional_state) {
    console.log('\n✓ Field name: emotional_state');
    console.log('Value:', decision.emotional_state);
  }
  if (decision.emotionalState) {
    console.log('\n✓ Field name: emotionalState');
    console.log('Value:', decision.emotionalState);
  }
})();

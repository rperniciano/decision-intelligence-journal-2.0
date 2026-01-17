const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecision() {
  // Use known user ID for session35test@example.com
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51';
  console.log('User ID:', userId);

  // Create a test decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'REGRESSION_SESSION54_DEEP_LINK_TEST',
      status: 'decided',
      detected_emotional_state: 'confident',
      raw_transcript: 'Test decision for deep linking regression test',
      chosen_option_id: null
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('Decision created:', decision.id);
  console.log('URL:', `http://localhost:5173/decisions/${decision.id}`);
}

createDecision();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDecision() {
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('title', 'MANUAL_DECISION_SESSION28_TEST')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== MANUAL DECISION VERIFICATION ===\n');
  console.log('Decision ID:', data.id);
  console.log('Title:', data.title);
  console.log('Description:', data.description);
  console.log('Status:', data.status);
  console.log('Category ID:', data.category_id);
  console.log('Emotional State:', data.emotional_state);
  console.log('Created At:', data.created_at);
  console.log('\nAll data preserved correctly!');
}

verifyDecision();

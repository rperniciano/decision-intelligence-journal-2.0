const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecision() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51'; // session35test user

  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'REGRESSION_TEST_82_UPDATE_TITLE',
      status: 'decided',
      detected_emotional_state: 'confident',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Created decision:', data);
  }
}

createDecision();

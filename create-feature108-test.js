const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51';

  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'FEATURE_108_TEST_DELETE_ME',
      detected_emotional_state: 'confident',
      status: 'in_progress'
    })
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Created test decision:', data.id);
    console.log('URL: http://localhost:5173/decisions/' + data.id);
  }
}

createTestDecision();

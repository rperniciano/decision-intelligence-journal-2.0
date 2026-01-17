const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const userId = '90f2e690-b1fb-414f-a259-0194f4b0b3d0'; // session27test user

  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'DECISION_WITH_ANXIOUS_EMOTION',
      detected_emotional_state: 'anxious',
      status: 'decided',
      description: 'This decision was made while feeling anxious'
    })
    .select()
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Decision created with anxious emotion!');
    console.log('ID:', decision.id);
    console.log('Title:', decision.title);
    console.log('Emotional State:', decision.detected_emotional_state);
  }
})();

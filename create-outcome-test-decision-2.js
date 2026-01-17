import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createDecision() {
  const userId = '94bd67cb-b094-4387-a9c8-26b0c65904cd'; // mobiletest user

  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'OUTCOME_TEST_DECISION_2',
      description: 'Second test to verify score calculation',
      status: 'decided',
      decided_at: new Date().toISOString(),
      detected_emotional_state: 'confident',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating decision:', error);
  } else {
    console.log('Created decision:', data.title);
    console.log('Decision ID:', data.id);
  }
}

createDecision();

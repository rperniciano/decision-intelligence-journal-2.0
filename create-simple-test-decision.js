import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51'; // session35test

async function createDecision() {
  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'SESSION_50_REGRESSION_TEST',
      status: 'in_progress',
      detected_emotional_state: 'neutral'
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

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecision() {
  const userId = '94bd67cb-b094-4387-a9c8-26b0c65904cd'; // mobiletest user

  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'TEST_CATEGORY_DROPDOWN',
      description: 'Decision for testing category dropdown',
      status: 'decided',
      detected_emotional_state: 'confident',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating decision:', error);
    process.exit(1);
  }

  console.log('Decision created successfully!');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('\nYou can now navigate to /decisions/' + decision.id + ' to edit it.');
}

createDecision();

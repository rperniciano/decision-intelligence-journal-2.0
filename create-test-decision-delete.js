import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  const uniqueTitle = `DELETE_TEST_${Date.now()}`;

  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: '94bd67cb-b094-4387-a9c8-26b0c65904cd', // mobiletest user
      title: uniqueTitle,
      description: 'This decision will be deleted during testing',
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
  console.log('\nYou can now verify this decision appears in History, then delete it.');
}

createTestDecision();

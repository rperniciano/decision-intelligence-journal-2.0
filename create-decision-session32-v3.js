import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecision() {
  // User ID from previous script
  const userId = 'ea1654e3-2b8b-47f3-8619-77e70c2f17ca';

  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Test Decision for Option Editing - Session 32',
      description: 'This decision is for testing option editing functionality.',
      status: 'pending',
      detected_emotional_state: 'confident'
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('Decision created:', decision.id);
  console.log('Title:', decision.title);

  // Create options
  const options = [
    { title: 'Option Alpha - Session 32', description: 'First option for testing' },
    { title: 'Option Beta - Session 32', description: 'Second option for testing' },
    { title: 'Option Gamma - Session 32', description: 'Third option for testing' }
  ];

  for (const option of options) {
    const { data, error } = await supabase
      .from('options')
      .insert({
        decision_id: decision.id,
        title: option.title,
        description: option.description
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating option:', error);
    } else {
      console.log('Option created:', data.id, '-', data.title);
    }
  }
}

createDecision();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  // Use known user ID from session 35
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51';
  console.log('User ID:', userId);

  // Create a decision in "in_progress" status
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Test Decision for Abandon - Session 37',
      description: 'This decision will be abandoned during testing',
      status: 'in_progress'
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('Created decision:', decision.id);
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);
}

createTestDecision();

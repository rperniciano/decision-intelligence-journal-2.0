const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestDecision() {
  // Get the user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'test-f188@example.com');

  if (!user) {
    console.error('User not found');
    return;
  }

  // Create a simple decision without chosen option
  const decisionId = uuidv4();

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      id: decisionId,
      user_id: user.id,
      title: 'Test Decision F188 - Voice Reflection',
      status: 'decided',
      detected_emotional_state: 'neutral',
      decided_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  // Create an option
  const optionId = uuidv4();
  const { error: optError } = await supabase.from('options').insert({
    id: optionId,
    decision_id: decisionId,
    title: 'Option A - Voice Reflection Test',
    is_chosen: true,
    display_order: 0,
    ai_extracted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (optError) {
    console.error('Error creating option:', optError);
  }

  // Update decision with chosen option
  await supabase
    .from('decisions')
    .update({ chosen_option_id: optionId })
    .eq('id', decisionId);

  console.log('Test decision created successfully!');
  console.log('Decision ID:', decisionId);
  console.log('URL:', `http://localhost:5173/decisions/${decisionId}`);
}

createTestDecision();

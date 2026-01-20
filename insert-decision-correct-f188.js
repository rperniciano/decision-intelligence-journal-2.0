const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestDecision() {
  // Get the user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'test-f188@example.com');

  if (!user) {
    console.error('User not found');
    return;
  }

  // Create the decision with correct schema
  const decisionId = uuidv4();
  const option1Id = uuidv4();
  const option2Id = uuidv4();

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      id: decisionId,
      user_id: user.id,
      category_id: null,
      title: 'Test Decision F188 - Voice Reflection',
      status: 'decided',
      detected_emotional_state: 'Confident',
      chosen_option_id: option1Id,
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

  console.log('Decision created:', decision.id);

  // For this schema, options might be in a different table or stored differently
  // Let's check if there's an options table
  const { data: optsData, error: optsError } = await supabase
    .from('options')
    .select('*')
    .limit(1);

  if (optsData) {
    console.log('Options table exists, creating options...');
    const { error: insertOptsError } = await supabase.from('options').insert([
      {
        id: option1Id,
        decision_id: decisionId,
        name: 'Option A - Test Voice Reflection',
        position: 0,
        is_chosen: true,
        created_at: new Date().toISOString(),
      },
      {
        id: option2Id,
        decision_id: decisionId,
        name: 'Option B',
        position: 1,
        is_chosen: false,
        created_at: new Date().toISOString(),
      }
    ]);

    if (insertOptsError) {
      console.error('Error creating options:', insertOptsError);
    }
  } else {
    console.log('Options table might not exist or is structured differently');
  }

  console.log('Test decision created successfully!');
  console.log('Decision ID:', decisionId);
  console.log('URL:', `http://localhost:5173/decisions/${decisionId}`);
}

createTestDecision();

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

  // Get or create a category
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Testing')
    .eq('user_id', user.id)
    .single();

  let categoryId;
  if (categories) {
    categoryId = categories.id;
  } else {
    const { data: newCategory } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: 'Testing',
        color: '#00d4aa',
        icon: '🧪',
        decision_count: 0,
        positive_rate: 0,
        is_system: false,
      })
      .select('id')
      .single();
    categoryId = newCategory.id;
  }

  // Create the decision
  const decisionId = uuidv4();
  const option1Id = uuidv4();
  const option2Id = uuidv4();

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      id: decisionId,
      user_id: user.id,
      category_id: categoryId,
      title: 'Test Decision F188 - Voice Reflection',
      status: 'decided',
      emotional_state: 'Confident',
      confidence_level: 4,
      chosen_option_id: option1Id,
      recorded_at: new Date().toISOString(),
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

  // Create options
  await supabase.from('options').insert([
    {
      id: option1Id,
      decision_id: decisionId,
      name: 'Option A - Voice Reflection Test',
      position: 0,
      is_chosen: true,
    },
    {
      id: option2Id,
      decision_id: decisionId,
      name: 'Option B',
      position: 1,
      is_chosen: false,
    }
  ]);

  console.log('Test decision created successfully!');
  console.log('Decision ID:', decisionId);
  console.log('URL:', `http://localhost:5173/decisions/${decisionId}`);
}

createTestDecision();

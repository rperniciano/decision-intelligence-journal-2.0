import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTestDecision() {
  // Get the user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === 'feature77-test@example.com');

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Using user:', user.id);

  // Create a category
  const { data: category, error: catError } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: 'Test Category',
      color: '#00d4aa',
      icon: '🧪',
      decision_count: 0,
      positive_rate: 0,
      is_system: false
    })
    .select()
    .single();

  if (catError) {
    console.error('Error creating category:', catError);
  } else {
    console.log('Category created:', category.id);
  }

  const categoryId = category?.id || null;

  // Create a decision with "reviewed" status (meaning it has outcomes)
  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      category_id: categoryId,
      title: 'Feature 77 Test - Multiple Check-ins',
      status: 'reviewed',
      emotional_state: 'neutral',
      confidence_level: 4,
      recorded_at: new Date().toISOString(),
      decided_at: new Date().toISOString(),
      ai_extraction: {
        options: [
          { name: 'Option A', pros: ['Pro 1'], cons: ['Con 1'] },
          { name: 'Option B', pros: ['Pro 2'], cons: ['Con 2'] }
        ]
      },
      ai_confidence: 0.9
    })
    .select()
    .single();

  if (decError) {
    console.error('Error creating decision:', decError);
    return;
  }

  console.log('Decision created:', decision.id);

  // Add two options
  const { data: option1 } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      name: 'Option A',
      position: 0,
      is_chosen: true
    })
    .select()
    .single();

  const { data: option2 } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      name: 'Option B',
      position: 1,
      is_chosen: false
    })
    .select()
    .single();

  console.log('Options created:', option1?.id, option2?.id);

  // Create TWO outcomes (check-ins) with different check_in_numbers
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // First check-in
  const { data: outcome1, error: out1Error } = await supabase
    .from('outcomes')
    .insert({
      decision_id: decision.id,
      result: 'better',
      satisfaction: 4,
      scheduled_for: twoWeeksAgo.toISOString().split('T')[0],
      recorded_at: twoWeeksAgo.toISOString(),
      check_in_number: 1,
      learned: 'First check-in learning'
    })
    .select()
    .single();

  if (out1Error) {
    console.error('Error creating outcome 1:', out1Error);
  } else {
    console.log('First outcome created:', outcome1.id);
  }

  // Second check-in
  const { data: outcome2, error: out2Error } = await supabase
    .from('outcomes')
    .insert({
      decision_id: decision.id,
      result: 'as_expected',
      satisfaction: 3,
      scheduled_for: oneWeekAgo.toISOString().split('T')[0],
      recorded_at: oneWeekAgo.toISOString(),
      check_in_number: 2,
      learned: 'Second check-in learning'
    })
    .select()
    .single();

  if (out2Error) {
    console.error('Error creating outcome 2:', out2Error);
  } else {
    console.log('Second outcome created:', outcome2.id);
  }

  console.log('\n✅ Test data setup complete!');
  console.log('Decision ID:', decision.id);
  console.log('View at: http://localhost:5173/decisions/' + decision.id);
}

setupTestDecision().catch(console.error);

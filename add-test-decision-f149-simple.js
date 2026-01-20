import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addTestDecision() {
  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.log('No users found');
    return;
  }

  const user = users[0];
  const userId = user.id;
  console.log('Using user:', user.email, '(' + userId + ')');

  const decisionId = randomUUID();

  // Insert decision
  const decision = {
    id: decisionId,
    user_id: userId,
    title: 'Should I switch to a new job offer?',
    status: 'draft',
    detected_emotional_state: 'uncertain',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: decisionData, error: decisionError } = await supabase
    .from('decisions')
    .insert(decision)
    .select()
    .single();

  if (decisionError) {
    console.log('Decision error:', decisionError.message);
    return;
  }

  console.log('Created decision:', decisionData.id);

  // Create options
  const option1Id = randomUUID();
  const option2Id = randomUUID();

  await supabase.from('options').insert([
    {
      id: option1Id,
      decision_id: decisionId,
      title: 'Stay at current job',
      display_order: 0
    },
    {
      id: option2Id,
      decision_id: decisionId,
      title: 'Take the new job offer',
      display_order: 1
    }
  ]);

  // Create pros and cons for option 1
  await supabase.from('pros_cons').insert([
    { id: randomUUID(), option_id: option1Id, type: 'pro', content: 'Familiar team and processes', display_order: 0 },
    { id: randomUUID(), option_id: option1Id, type: 'pro', content: 'Good work-life balance', display_order: 1 },
    { id: randomUUID(), option_id: option1Id, type: 'pro', content: 'Close to home', display_order: 2 },
    { id: randomUUID(), option_id: option1Id, type: 'con', content: 'Lower salary', display_order: 0 },
    { id: randomUUID(), option_id: option1Id, type: 'con', content: 'Limited growth opportunities', display_order: 1 },
    { id: randomUUID(), option_id: option1Id, type: 'con', content: 'Boring projects', display_order: 2 },
  ]);

  // Create pros and cons for option 2
  await supabase.from('pros_cons').insert([
    { id: randomUUID(), option_id: option2Id, type: 'pro', content: '30% salary increase', display_order: 0 },
    { id: randomUUID(), option_id: option2Id, type: 'pro', content: 'Exciting new technologies', display_order: 1 },
    { id: randomUUID(), option_id: option2Id, type: 'pro', content: 'Better career growth', display_order: 2 },
    { id: randomUUID(), option_id: option2Id, type: 'con', content: 'Unknown team culture', display_order: 0 },
    { id: randomUUID(), option_id: option2Id, type: 'con', content: 'Longer commute', display_order: 1 },
    { id: randomUUID(), option_id: option2Id, type: 'con', content: 'Risk of new environment', display_order: 2 },
  ]);

  console.log('\nCreated test decision for Feature #149:');
  console.log('  ID:', decisionData.id);
  console.log('  Title:', decisionData.title);
  console.log('\nReview page URL: http://localhost:5173/decisions/' + decisionData.id + '/review');
  console.log('\nUse credentials:');
  console.log('  Email:', user.email);
  console.log('  Password: password123 (if newly created)');
}

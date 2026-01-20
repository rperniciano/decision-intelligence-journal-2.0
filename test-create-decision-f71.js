// Test creating a decision for Feature #71
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }

  const testUser = users.find(u => u.email.includes('feature71-test'));

  if (!testUser) {
    console.error('Test user not found');
    return;
  }

  console.log('Creating decision for user:', testUser.email);
  console.log('User ID:', testUser.id);

  // Create a decision with a past decide_by date and status='decided'
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const decisionData = {
    user_id: testUser.id,
    title: 'TEST F71 - Should I buy a new laptop',
    status: 'decided',
    decided_at: new Date().toISOString(),
    follow_up_date: new Date().toISOString(), // Due now
  };

  console.log('Decision data:', JSON.stringify(decisionData, null, 2));

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert(decisionData)
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✅ Decision created successfully!');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Follow-up date:', decision.follow_up_date);

  // Add an option
  const { data: option, error: optionError } = await supabase
    .from('options')
    .insert({
      decision_id: decision.id,
      name: 'Buy new laptop now',
      position: 1,
      is_chosen: true
    })
    .select()
    .single();

  if (optionError) {
    console.error('Error creating option:', optionError);
  } else {
    console.log('✅ Option created successfully!');
    console.log('Option:', option.name);
  }

  console.log('\n=================================');
  console.log('DECISION READY FOR TESTING!');
  console.log('User:', testUser.email);
  console.log('Password: test123456');
  console.log('=================================');
}

createTestDecision();

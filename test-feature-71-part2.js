// Test Feature #71 Part 2 - Create another decision for testing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision2() {
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

  console.log('Creating SECOND decision for user:', testUser.email);

  // Create a decision with a past follow_up_date and NO outcome
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const decisionData = {
    user_id: testUser.id,
    title: 'TEST F71 PART 2 - Should I learn TypeScript',
    status: 'decided',
    decided_at: new Date().toISOString(),
    follow_up_date: yesterday.toISOString(), // Due yesterday
    // NO outcome field - should appear in pending reviews
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

  console.log('✅ Second decision created successfully!');
  console.log('Decision ID:', decision.id);
  console.log('Title:', decision.title);
  console.log('Follow-up date:', decision.follow_up_date);
  console.log('Outcome:', decision.outcome || 'null (should appear in Pending Reviews)');

  console.log('\n=================================');
  console.log('READY FOR TESTING PART 2!');
  console.log('This decision should appear in Pending Reviews');
  console.log('The first decision should NOT appear (has outcome)');
  console.log('=================================');
}

createTestDecision2();

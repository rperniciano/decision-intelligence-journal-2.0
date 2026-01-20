import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestData() {
  const email = 'testf172@example.com';

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const userId = user.id;
  console.log('Found user:', userId);

  // Create a test decision
  const decision = {
    user_id: userId,
    title: 'Test Decision for F172 - Cascade Delete',
    description: 'This decision tests Feature #172: Delete decision removes outcomes. Will have outcomes that should cascade delete.',
    status: 'decided',
    created_at: new Date().toISOString()
  };

  const { data: decisionData, error: decisionError } = await supabase
    .from('decisions')
    .insert(decision)
    .select();

  if (decisionError) {
    console.log('Decision error:', decisionError.message);
    return;
  }

  const decisionId = decisionData[0].id;
  console.log('Created decision ID:', decisionId);

  // Create multiple outcomes for this decision
  const outcomes = [
    {
      decision_id: decisionId,
      result: 'better',
      satisfaction: 5,
      learned: 'First outcome - should be deleted when decision is deleted',
      check_in_number: 1,
      recorded_at: new Date().toISOString()
    },
    {
      decision_id: decisionId,
      result: 'as_expected',
      satisfaction: 3,
      learned: 'Second outcome - should be deleted when decision is deleted',
      check_in_number: 2,
      recorded_at: new Date().toISOString()
    },
    {
      decision_id: decisionId,
      result: 'better',
      satisfaction: 4,
      learned: 'Third outcome - should be deleted when decision is deleted',
      check_in_number: 3,
      recorded_at: new Date().toISOString()
    }
  ];

  const { data: outcomesData, error: outcomesError } = await supabase
    .from('outcomes')
    .insert(outcomes)
    .select();

  if (outcomesError) {
    console.log('Outcomes error:', outcomesError.message);
    return;
  }

  console.log('Created', outcomesData.length, 'outcomes:');
  outcomesData.forEach(o => {
    console.log('  - Outcome ID:', o.id, 'Result:', o.result, 'Satisfaction:', o.satisfaction);
  });

  console.log('\n=== TEST DATA READY ===');
  console.log('Decision ID:', decisionId);
  console.log('Outcome IDs:', outcomesData.map(o => o.id).join(', '));
  console.log('\nTest steps:');
  console.log('1. Navigate to decision:', `http://localhost:5173/decisions/${decisionId}`);
  console.log('2. Verify outcomes are displayed');
  console.log('3. Delete the decision');
  console.log('4. Query outcomes table to verify cascade delete worked');
}

createTestData();

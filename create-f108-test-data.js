const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createF108TestData() {
  console.log('Creating test data for Feature #108...');

  // Create test user
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      email: 'f108-test@example.com',
      password_hash: 'dummy_hash_for_testing'
    })
    .select()
    .single();

  if (userError) {
    console.error('Error creating user:', userError);
    return;
  }

  console.log('Created user:', user.id);

  // Create a decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'Feature 108 Test Decision',
      description: 'This decision will be deleted to test 404 handling',
      category_id: 'f0427913-ec86-4ec4-b135-3c4d2b91c2d3', // Career category
      status: 'pending',
      decide_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      options: [
        { id: '1', title: 'Option A', pros: ['Pro 1'], cons: ['Con 1'], score: 5 },
        { id: '2', title: 'Option B', pros: ['Pro 2'], cons: ['Con 2'], score: 3 }
      ],
      emotional_state: {
        primary: 'neutral',
        intensity: 3,
        notes: 'Test emotional state'
      }
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('Created decision:', decision.id);
  console.log('\n=== TEST DATA READY ===');
  console.log('User ID:', user.id);
  console.log('Decision ID:', decision.id);
  console.log('Decision URL: http://localhost:5173/decisions/' + decision.id);
  console.log('\nNext steps:');
  console.log('1. Log in as this user');
  console.log('2. Copy the decision URL above');
  console.log('3. Delete the decision');
  console.log('4. Navigate to the copied URL');
  console.log('5. Verify 404 page shows gracefully');
}

createF108TestData();

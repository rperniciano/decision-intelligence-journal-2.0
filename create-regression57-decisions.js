const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecisions() {
  const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51'; // session35test user

  // Create 3 test decisions
  const decisions = [
    {
      user_id: userId,
      title: 'REGRESSION_57_DECISION_1',
      status: 'in_progress',
      detected_emotional_state: 'confident',
      created_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'REGRESSION_57_DECISION_2',
      status: 'in_progress',
      detected_emotional_state: 'neutral',
      created_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: 'REGRESSION_57_DECISION_3',
      status: 'decided',
      detected_emotional_state: 'anxious',
      decided_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ];

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select();

    if (error) {
      console.error('Error creating decision:', error);
    } else {
      console.log('Created:', data[0].title, '- ID:', data[0].id);
    }
  }

  console.log('\n✅ Created 3 test decisions for Regression Test #57');
}

createTestDecisions();

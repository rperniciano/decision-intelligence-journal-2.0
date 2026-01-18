// Session 73 - Create test decisions with outcomes for insights testing
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecisions() {
  const email = 'session72test@example.com';

  // Get user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Creating test decisions for user:', user.id);

  // Create 5 decisions with outcomes for insights testing
  const decisions = [
    {
      user_id: user.id,
      title: 'INSIGHTS_TEST_1_Career_Change',
      description: 'Should I accept the new job offer?',
      status: 'decided',
      category_id: null,
      outcome: 'better',
      outcome_notes: 'Great decision! Love the new role.',
    },
    {
      user_id: user.id,
      title: 'INSIGHTS_TEST_2_Investment',
      description: 'Should I invest in stocks?',
      status: 'decided',
      category_id: null,
      outcome: 'worse',
      outcome_notes: 'Lost some money, should have researched more.',
    },
    {
      user_id: user.id,
      title: 'INSIGHTS_TEST_3_Exercise_Routine',
      description: 'Should I start morning workouts?',
      status: 'decided',
      category_id: null,
      outcome: 'better',
      outcome_notes: 'Feeling great! More energy throughout the day.',
    },
    {
      user_id: user.id,
      title: 'INSIGHTS_TEST_4_Move_Cities',
      description: 'Should I move to a new city?',
      status: 'decided',
      category_id: null,
      outcome: 'as_expected',
      outcome_notes: 'It has been okay, not great but not bad either.',
    },
    {
      user_id: user.id,
      title: 'INSIGHTS_TEST_5_Learn_Programming',
      description: 'Should I learn a new programming language?',
      status: 'decided',
      category_id: null,
      outcome: 'better',
      outcome_notes: 'Amazing! Opens up new opportunities.',
    },
  ];

  for (const decision of decisions) {
    const { error } = await supabase
      .from('decisions')
      .insert(decision);

    if (error) {
      console.error('Error creating decision:', decision.title, error);
    } else {
      console.log('✅ Created:', decision.title);
    }
  }

  console.log('\n✅ Test decisions created successfully!');
  console.log('Summary:');
  console.log('- 5 decisions total');
  console.log('- 3 with outcome "better" (60% positive)');
  console.log('- 1 with outcome "worse" (20% negative)');
  console.log('- 1 with outcome "as_expected" (20% neutral)');
}

createTestDecisions();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_EMAIL = 'session21test@example.com';

async function addOutcomes() {
  // Get user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === USER_EMAIL);
  const userId = user.id;

  // Get the 2 decisions without outcomes
  const { data: decisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', userId)
    .in('title', ['STATS_TEST_DECISION_1', 'STATS_TEST_DECISION_2']);

  console.log('Adding outcomes to', decisions.length, 'decisions...');

  for (const decision of decisions) {
    const { error } = await supabase
      .from('decisions')
      .update({
        outcome: 'better',
        outcome_notes: 'Test outcome',
        outcome_recorded_at: new Date().toISOString(),
      })
      .eq('id', decision.id);

    if (error) {
      console.error('Error updating decision:', error);
    } else {
      console.log('Added outcome to:', decision.title);
    }
  }

  console.log('✅ Now all 3 STATS_TEST_CAT decisions have outcomes');
}

addOutcomes();

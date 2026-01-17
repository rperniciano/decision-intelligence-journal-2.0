import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_EMAIL = 'session21test@example.com';

async function addDecisionWithOutcome() {
  // Get user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === USER_EMAIL);
  const userId = user.id;

  // Get STATS_TEST_CAT category
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('slug', 'stats-test-cat')
    .single();

  // Create 1 decision with outcome
  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      category_id: category.id,
      title: 'STATS_TEST_DECISION_WITH_OUTCOME',
      status: 'decided',
      detected_emotional_state: 'confident',
      outcome: 'better',
      outcome_notes: 'This worked out great!',
      outcome_recorded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    })
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Created decision with outcome:', decision.title);
  console.log('Now we have 3 decisions total in STATS_TEST_CAT (1 with outcome)');
}

addDecisionWithOutcome();

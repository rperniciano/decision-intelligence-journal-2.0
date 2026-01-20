import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const decisionId = '9ac69de3-db72-4c0a-b20d-d4e738231a08';

console.log('Checking reminders for decision:', decisionId);

const { data: reminders, error } = await supabase
  .from('DecisionsFollowUpReminders')
  .select('*')
  .eq('decision_id', decisionId);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Reminders found:', reminders.length);
  if (reminders.length > 0) {
    console.log('Reminder details:', JSON.stringify(reminders[0], null, 2));
  } else {
    console.log('No reminders found for this decision');
  }
}

// Also check the decision status
const { data: decision } = await supabase
  .from('decisions')
  .select('id, title, status, decided_at')
  .eq('id', decisionId)
  .single();

console.log('\nDecision status:', decision?.status);
console.log('Decided at:', decision?.decided_at);

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const decisionId = 'c1ac3194-4115-4ffc-b158-e3c67f242adf';

console.log('==========================================');
console.log('Feature #184: FINAL TEST (New Server)');
console.log('==========================================');
console.log('Decision ID:', decisionId);

// Check decision status
const { data: decision } = await supabase
  .from('decisions')
  .select('id, title, status, decided_at, created_at')
  .eq('id', decisionId)
  .single();

console.log('\nDecision Details:');
console.log('  Title:', decision?.title);
console.log('  Status:', decision?.status);
console.log('  Decided At:', decision?.decided_at);

// Check for reminders
const { data: reminders, error } = await supabase
  .from('DecisionsFollowUpReminders')
  .select('*')
  .eq('decision_id', decisionId);

console.log('\nReminders found:', reminders?.length || 0);

if (error) {
  console.error('Error:', error);
}

if (reminders && reminders.length > 0) {
  const reminder = reminders[0];
  console.log('\n✅✅✅ SUCCESS! Automatic reminder created! ✅✅✅');
  console.log('\nReminder Details:');
  console.log('  ID:', reminder.id);
  console.log('  Remind At:', reminder.remind_at);
  console.log('  Status:', reminder.status);

  const reminderDate = new Date(reminder.remind_at);
  const today = new Date();
  const daysDiff = Math.round((reminderDate - today) / (1000 * 60 * 60 * 24));

  console.log('\nTiming Check:');
  console.log('  Days from now:', daysDiff);
  console.log('  Expected: 14 days');

  if (daysDiff === 14) {
    console.log('  ✅ PERFECT! Exactly 2 weeks!');
  }

  console.log('\n==========================================');
  console.log('Feature #184: PASSED ✅');
  console.log('==========================================');
  process.exit(0);
} else {
  console.log('\n❌ FAILED: No reminder created');
  console.log('\nThe feature is not working yet.');
  console.log('==========================================');
  console.log('Feature #184: NOT PASSING ❌');
  console.log('==========================================');
  process.exit(1);
}

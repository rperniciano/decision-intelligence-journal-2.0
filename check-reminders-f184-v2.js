import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const decisionId = 'c0250670-5eaf-45dd-a22c-eddaf6c14c63';

console.log('==========================================');
console.log('Feature #184 Verification');
console.log('==========================================');
console.log('Decision ID:', decisionId);

// Check decision status
const { data: decision } = await supabase
  .from('decisions')
  .select('id, title, status, decided_at')
  .eq('id', decisionId)
  .single();

console.log('\nDecision Status:', decision?.status);
console.log('Decided At:', decision?.decided_at);

// Check for reminders
const { data: reminders, error } = await supabase
  .from('DecisionsFollowUpReminders')
  .select('*')
  .eq('decision_id', decisionId);

console.log('\nReminders found:', reminders?.length || 0);

if (error) {
  console.error('Error fetching reminders:', error);
  console.log('\n❌ FAILED: Error checking reminders');
} else if (reminders && reminders.length > 0) {
  const reminder = reminders[0];
  console.log('\n✅ SUCCESS: Automatic reminder created!');
  console.log('\nReminder Details:');
  console.log('  ID:', reminder.id);
  console.log('  Remind At:', reminder.remind_at);
  console.log('  Status:', reminder.status);

  // Calculate expected date (14 days from now)
  const reminderDate = new Date(reminder.remind_at);
  const today = new Date();
  const expectedDate = new Date(today);
  expectedDate.setDate(today.getDate() + 14);

  const daysDiff = Math.round((reminderDate - today) / (1000 * 60 * 60 * 24));

  console.log('\nTiming Verification:');
  console.log('  Days from now:', daysDiff);
  console.log('  Expected: 14 days');

  if (daysDiff === 14) {
    console.log('  ✅ Timing is correct (2 weeks)');
  } else {
    console.log('  ⚠️  Timing may be off');
  }
} else {
  console.log('\n❌ FAILED: No reminder created automatically');
  console.log('\nThis means the automatic reminder creation code is not working.');
}

console.log('\n==========================================');

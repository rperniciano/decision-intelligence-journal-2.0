import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const decisionId = '9f5aed5c-3dc1-4494-8660-2b8a0fddf65f';

console.log('==========================================');
console.log('Feature #184: Direct API Test Verification');
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
console.log('  Created At:', decision?.created_at);

// Check for reminders
const { data: reminders, error } = await supabase
  .from('DecisionsFollowUpReminders')
  .select('*')
  .eq('decision_id', decisionId);

console.log('\nReminders found:', reminders?.length || 0);

if (error) {
  console.error('Error fetching reminders:', error);
} else if (reminders && reminders.length > 0) {
  const reminder = reminders[0];
  console.log('\n✅ SUCCESS: Automatic reminder created!');
  console.log('\nReminder Details:');
  console.log('  ID:', reminder.id);
  console.log('  Remind At:', reminder.remind_at);
  console.log('  Status:', reminder.status);
  console.log('  User ID:', reminder.user_id);

  // Calculate expected date (14 days from now)
  const reminderDate = new Date(reminder.remind_at);
  const today = new Date();
  const daysDiff = Math.round((reminderDate - today) / (1000 * 60 * 60 * 24));

  console.log('\nTiming Verification:');
  console.log('  Reminder date:', reminder.remind_at);
  console.log('  Days from now:', daysDiff);
  console.log('  Expected: 14 days (2 weeks)');

  if (daysDiff === 14) {
    console.log('  ✅ Timing is PERFECT!');
  } else if (daysDiff >= 13 && daysDiff <= 15) {
    console.log('  ✅ Timing is correct (within 1 day tolerance)');
  } else {
    console.log('  ⚠️  Timing may be off');
  }

  console.log('\n==========================================');
  console.log('Feature #184: PASSED ✅');
  console.log('Automatic reminder creation is working!');
  console.log('==========================================');
  process.exit(0);
} else {
  console.log('\n❌ FAILED: No reminder created automatically');
  console.log('\nPossible reasons:');
  console.log('1. API server has old code (needs restart)');
  console.log('2. Code path not being triggered');
  console.log('3. Database insert failing silently');
  console.log('\n==========================================');
  console.log('Feature #184: FAILED ❌');
  console.log('==========================================');
  process.exit(1);
}

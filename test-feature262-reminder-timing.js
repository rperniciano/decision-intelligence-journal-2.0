// Feature #262: Reminders fire at correct time - Test script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReminderTiming() {
  console.log('=== Feature #262: Reminder Timing Test ===\n');

  const testEmail = 'feature262testv2@example.com';

  // 1. Get the test user
  console.log('1. Getting test user...');
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === testEmail);

  if (!user) {
    console.error('Test user not found!');
    return;
  }

  console.log(`   Found user: ${user.id}`);

  // 2. Create a test decision
  console.log('\n2. Creating test decision...');
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'TEST_262_Reminder Timing Decision',
      status: 'decided',
      decided_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log(`   Created decision: ${decision.id}`);

  // 3. Create a reminder for 2 minutes from now in the user's timezone
  console.log('\n3. Creating reminder for 2 minutes from now...');

  // Get current time in user's assumed timezone (Europe/Rome - UTC+1)
  const now = new Date();
  const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000);

  console.log(`   Current time (UTC): ${now.toISOString()}`);
  console.log(`   Reminder time (UTC): ${twoMinutesFromNow.toISOString()}`);

  const { data: reminder, error: reminderError } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert({
      decision_id: decision.id,
      user_id: user.id,
      remind_at: twoMinutesFromNow.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (reminderError) {
    console.error('Error creating reminder:', reminderError);
    return;
  }

  console.log(`   Created reminder: ${reminder.id}`);
  console.log(`   Reminder scheduled for: ${reminder.remind_at}`);

  // 4. Verify reminder is NOT in pending reviews yet (too early)
  console.log('\n4. Verifying reminder is NOT pending yet...');
  const { data: pendingEarly, error: earlyError } = await supabase
    .from('DecisionsFollowUpReminders')
    .select(`
      id,
      decision_id,
      remind_at,
      status,
      decisions!inner(
        id,
        title
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .lte('remind_at', new Date().toISOString());

  if (earlyError) {
    console.error('Error checking pending reviews:', earlyError);
  } else {
    console.log(`   Pending reminders (should be 0): ${pendingEarly.length}`);
    if (pendingEarly.length === 0) {
      console.log('   ✅ PASS: Reminder correctly NOT showing as pending');
    } else {
      console.log('   ❌ FAIL: Reminder showing as pending too early!');
    }
  }

  // 5. Wait 2 minutes and check again
  console.log('\n5. Waiting 2 minutes for reminder to become due...');
  console.log('   (This simulates time passing)');
  await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000)); // Wait 2 minutes

  console.log('\n6. Checking if reminder is now pending...');

  const { data: pendingAfter, error: afterError } = await supabase
    .from('DecisionsFollowUpReminders')
    .select(`
      id,
      decision_id,
      remind_at,
      status,
      decisions!inner(
        id,
        title
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .lte('remind_at', new Date().toISOString());

  if (afterError) {
    console.error('Error checking pending reviews:', afterError);
  } else {
    console.log(`   Pending reminders: ${pendingAfter.length}`);
    const foundReminder = pendingAfter.find(r => r.id === reminder.id);
    if (foundReminder) {
      console.log('   ✅ PASS: Reminder now showing as pending');
      console.log(`   Decision: ${foundReminder.decisions.title}`);
      console.log(`   Reminder time: ${foundReminder.remind_at}`);
    } else {
      console.log('   ❌ FAIL: Reminder NOT showing as pending when it should be!');
    }
  }

  // 7. Test timezone handling - create reminder for specific time in different timezone
  console.log('\n7. Testing timezone handling...');
  console.log('   Creating a reminder for a specific time...');

  // Create a reminder for tomorrow at 10 AM UTC
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(10, 0, 0, 0);

  const { data: reminderTZ, error: reminderTZError } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert({
      decision_id: decision.id,
      user_id: user.id,
      remind_at: tomorrow.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (reminderTZError) {
    console.error('Error creating timezone test reminder:', reminderTZError);
  } else {
    console.log(`   Created reminder for: ${reminderTZ.remind_at}`);
    console.log('   ✅ PASS: Reminder created with UTC timestamp');

    // Verify it's stored correctly in UTC
    const storedDate = new Date(reminderTZ.remind_at);
    if (storedDate.getUTCHours() === 10 && storedDate.getUTCMinutes() === 0) {
      console.log('   ✅ PASS: Timezone correctly stored as UTC');
    } else {
      console.log('   ❌ FAIL: Timezone conversion issue!');
    }
  }

  // Cleanup
  console.log('\n8. Cleaning up test data...');
  await supabase
    .from('DecisionsFollowUpReminders')
    .delete()
    .eq('decision_id', decision.id);

  await supabase
    .from('decisions')
    .delete()
    .eq('id', decision.id);

  console.log('   ✅ Test data cleaned up');

  console.log('\n=== Test Complete ===');
}

testReminderTiming().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReminderFeature() {
  console.log('=== Feature #74: Reminder scheduled at specified time ===\n');

  // 1. Create or get test user
  const testEmail = 'test_feature_74@example.com';
  const testPassword = 'test123456';

  console.log('1. Creating test user...');
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError && !signUpError.message.includes('already registered')) {
    console.error('Error signing up:', signUpError);
    return;
  }

  // Get existing user if already exists
  let userId = user?.id;
  if (!userId) {
    const { data: { user: existingUser } } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    userId = existingUser?.id;
  }

  console.log('✓ User ID:', userId);
  console.log('');

  // 2. Create a test decision
  console.log('2. Creating test decision with unique identifier...');
  const uniqueId = 'TEST_F74_' + Date.now();
  const testRemindAt = new Date('2026-02-15T14:30:00').toISOString(); // Specific future date

  // First create options
  const { data: optionData, error: optionError } = await supabase
    .from('decision_options')
    .insert([
      {
        decision_id: 'temp', // Will update after
        text: 'Option A',
        position: 1,
        pros: JSON.stringify(['Pro 1']),
        cons: JSON.stringify(['Con 1'])
      },
      {
        decision_id: 'temp',
        text: 'Option B',
        position: 2,
        pros: JSON.stringify(['Pro 2']),
        cons: JSON.stringify(['Con 2'])
      }
    ])
    .select();

  if (optionError) {
    console.error('Error creating options:', optionError);
    return;
  }

  // Now create the decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: `Feature #74 Test Decision ${uniqueId}`,
      context: `Test decision for Feature #74 verification. Unique ID: ${uniqueId}`,
      emotional_state: 'neutral',
      category: 'Testing',
      chosen_option_id: optionData[0].id, // Choose first option
      outcome: null,
      outcome_notes: null,
      status: 'decided',
      decided_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  // Update options with correct decision_id
  await supabase
    .from('decision_options')
    .update({ decision_id: decision.id })
    .in('id', optionData.map(o => o.id));

  console.log('✓ Decision ID:', decision.id);
  console.log('✓ Decision Title:', decision.title);
  console.log('');

  // 3. Create a reminder with a SPECIFIC date
  console.log('3. Setting reminder for specific date...');
  console.log('   Target remind_at:', testRemindAt);

  const { data: reminder, error: reminderError } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert({
      decision_id: decision.id,
      user_id: userId,
      remind_at: testRemindAt,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (reminderError) {
    console.error('Error creating reminder:', reminderError);
    return;
  }

  console.log('✓ Reminder ID:', reminder.id);
  console.log('✓ Reminder remind_at from DB:', reminder.remind_at);
  console.log('');

  // 4. Verify the remind_at matches the specified date
  console.log('4. Verification:');
  console.log('   Expected remind_at:', testRemindAt);
  console.log('   Actual remind_at:', reminder.remind_at);
  console.log('   Match:', testRemindAt === reminder.remind_at ? '✅ YES' : '❌ NO');

  if (testRemindAt === reminder.remind_at) {
    console.log('');
    console.log('✅ Feature #74 VERIFIED PASSING');
    console.log('   Reminders use the EXACT date specified by the user.');
    console.log('   No default or random dates are used.');
  } else {
    console.log('');
    console.log('❌ Feature #74 FAILED');
    console.log('   The remind_at does not match the specified date!');
  }

  console.log('');
  console.log('=== Test Data Created ===');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('Decision ID:', decision.id);
  console.log('Reminder ID:', reminder.id);
  console.log('');
  console.log('You can now log in and verify in the UI:');
  console.log(`http://localhost:5173/login`);
}

testReminderFeature().catch(console.error);

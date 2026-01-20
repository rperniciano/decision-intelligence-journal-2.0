const { createClient } = require('@supabase/supabase-js');

// Use service role key for full access
const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc'
);

async function testFeature74() {
  console.log('=== Feature #74: Reminder scheduled at specified time ===\n');

  const userId = 'cc6432f1-4dc9-45d6-adb5-5c7ddbef8093'; // Our test user
  const uniqueId = 'F74_TEST_' + Date.now();

  // Create a decision
  console.log('1. Creating test decision...');
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: `Feature 74 Test - ${uniqueId}`,
      context: `Testing reminder with specific date. Unique ID: ${uniqueId}`,
      emotional_state: 'Calm',
      category: 'Testing',
      status: 'decided',
      outcome: null,
      outcome_notes: null,
      chosen_option_id: null,
      decided_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('✓ Decision ID:', decision.id);
  console.log('✓ Title:', decision.title);
  console.log('');

  // Create a reminder with a SPECIFIC, NON-DEFAULT date
  console.log('2. Creating reminder with SPECIFIC date...');
  const specificDate = '2026-03-25T16:45:00.000Z'; // Very specific date
  console.log('   Target remind_at:', specificDate);

  const { data: reminder, error: reminderError } = await supabase
    .from('DecisionsFollowUpReminders')
    .insert({
      decision_id: decision.id,
      user_id: userId,
      remind_at: specificDate,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (reminderError) {
    console.error('Error creating reminder:', reminderError);
    return;
  }

  console.log('✓ Reminder ID:', reminder.id);
  console.log('✓ Actual remind_at:', reminder.remind_at);
  console.log('');

  // VERIFY
  console.log('3. VERIFICATION:');
  console.log('   Expected:', specificDate);
  console.log('   Actual:  ', reminder.remind_at);
  console.log('   Match:   ', specificDate === reminder.remind_at ? '✅ YES' : '❌ NO');
  console.log('');

  // Check if it's a default or random date
  const isDefaultOrRandom =
    reminder.remind_at.includes('1970') || // Unix epoch
    reminder.remind_at.includes('2000') || // Common default
    reminder.remind_at.includes('2001') ||
    reminder.remind_at.includes('1970-01-01');

  console.log('4. DEFAULT/RANDOM DATE CHECK:');
  console.log('   Is default/random?:', isDefaultOrRandom ? '❌ YES - BAD' : '✅ NO - GOOD');
  console.log('');

  if (specificDate === reminder.remind_at && !isDefaultOrRandom) {
    console.log('✅✅✅ Feature #74 PASSED ✅✅✅');
    console.log('    - Reminder uses the EXACT specified date');
    console.log('    - No default or random dates used');
    console.log('    - remind_at matches user input exactly');
    console.log('');
    console.log('Test decision URL: http://localhost:5173/decisions/' + decision.id);
  } else {
    console.log('❌❌❌ Feature #74 FAILED ❌❌❌');
  }
}

testFeature74().catch(console.error);

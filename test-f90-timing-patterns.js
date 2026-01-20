// Test Feature #90: Timing Patterns
// Create test user with decisions at specific hours to verify timing pattern calculation

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_EMAIL = `f90-timing-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'test123456';

// Hours to create decisions at (with desired outcomes)
// Best hours: 9 AM, 10 AM, 2 PM (should have high positive rate)
// Worst hours: 11 PM, 12 AM, 1 AM (should have low positive rate)
const testSchedule = [
  { hour: 9, outcome: 'better', dayOffset: 0 },   // Morning - good
  { hour: 9, outcome: 'better', dayOffset: 1 },   // Morning - good
  { hour: 10, outcome: 'better', dayOffset: 0 },  // Late morning - good
  { hour: 10, outcome: 'as_expected', dayOffset: 1 },
  { hour: 14, outcome: 'better', dayOffset: 0 },  // Afternoon - good
  { hour: 14, outcome: 'better', dayOffset: 1 },
  { hour: 23, outcome: 'worse', dayOffset: 0 },   // Late night - bad
  { hour: 23, outcome: 'worse', dayOffset: 1 },
  { hour: 0, outcome: 'worse', dayOffset: 0 },    // Midnight - bad
  { hour: 1, outcome: 'as_expected', dayOffset: 0 },
];

async function createTestUser() {
  console.log('Creating test user:', TEST_EMAIL);

  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  console.log('User created with ID:', data.user.id);
  return data.user.id;
}

async function createDecisionAtHour(userId, hour, outcome, dayOffset) {
  // Create a decision with created_at at the specific hour
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - dayOffset);
  targetDate.setHours(hour, 0, 0, 0);

  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: `TEST_90_DECISION_${hour}_${dayOffset}`,
      status: 'decided',
      outcome: outcome,
      outcome_recorded_at: new Date().toISOString(),
      created_at: targetDate.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating decision at hour ${hour}:`, error);
  } else {
    console.log(`✓ Created decision at ${hour}:00 with outcome: ${outcome}`);
  }

  return data;
}

async function main() {
  try {
    // Create test user
    const userId = await createTestUser();

    // Create profile
    await supabase.from('profiles').insert({
      id: userId,
      name: 'Feature 90 Test User',
    });

    console.log('\nCreating decisions at specific hours...\n');

    // Create decisions according to schedule
    for (const schedule of testSchedule) {
      await createDecisionAtHour(userId, schedule.hour, schedule.outcome, schedule.dayOffset);
    }

    console.log(`\n✅ Created ${testSchedule.length} test decisions`);
    console.log(`\nUser credentials:`);
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    console.log(`\nUse these credentials to test via browser or API`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

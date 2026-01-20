import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOutcomesTable() {
  console.log('Testing if outcomes table exists...\n');

  try {
    const { data, error } = await supabase
      .from('outcomes')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST204') {
        console.log('❌ Outcomes table does NOT exist');
        console.log('\nFeature #77 requires the outcomes table to track multiple check-ins.');
        console.log('Please run this SQL in Supabase SQL Editor:\n');
        console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql\n');
        console.log('Then run the SQL from: apps/api/migrations/create_outcomes_table.sql');
      } else {
        console.log('Error:', error.message);
      }
      return false;
    }

    console.log('✅ Outcomes table EXISTS!');
    console.log('Sample data:', data);
    return true;

  } catch (e) {
    console.log('Exception:', e.message);
    return false;
  }
}

async function createTestData() {
  const tableExists = await testOutcomesTable();
  if (!tableExists) {
    console.log('\n⚠️  Cannot create test data without outcomes table');
    console.log('Please create the table first using the SQL in apps/api/migrations/create_outcomes_table.sql');
    return;
  }

  // Get our test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === 'feature77-test@example.com');

  if (!user) {
    console.log('❌ Test user not found. Please register feature77-test@example.com first');
    return;
  }

  console.log('\nCreating test data for user:', user.id);

  // Create a test decision
  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'Feature 77 Test - Multiple Check-ins',
      status: 'reviewed',
      emotional_state: 'neutral',
      recorded_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decError) {
    console.log('Error creating decision:', decError);
    return;
  }

  console.log('✅ Decision created:', decision.id);

  // Create multiple outcomes (check-ins)
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: outcome1, error: err1 } = await supabase
    .from('outcomes')
    .insert({
      decision_id: decision.id,
      result: 'better',
      satisfaction: 4,
      scheduled_for: twoWeeksAgo.toISOString().split('T')[0],
      recorded_at: twoWeeksAgo.toISOString(),
      check_in_number: 1,
      learned: 'First check-in - went well'
    })
    .select()
    .single();

  if (err1) {
    console.log('Error creating outcome 1:', err1);
  } else {
    console.log('✅ First outcome created:', outcome1.id, '(check-in #1)');
  }

  const { data: outcome2, error: err2 } = await supabase
    .from('outcomes')
    .insert({
      decision_id: decision.id,
      result: 'as_expected',
      satisfaction: 3,
      scheduled_for: oneWeekAgo.toISOString().split('T')[0],
      recorded_at: oneWeekAgo.toISOString(),
      check_in_number: 2,
      learned: 'Second check-in - as expected'
    })
    .select()
    .single();

  if (err2) {
    console.log('Error creating outcome 2:', err2);
  } else {
    console.log('✅ Second outcome created:', outcome2.id, '(check-in #2)');
  }

  console.log('\n✅ Test data ready!');
  console.log('View at: http://localhost:5173/decisions/' + decision.id);
}

createTestData().catch(console.error);

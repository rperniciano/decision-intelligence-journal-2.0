// Create a test decision for Feature #135 testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  const email = 'f135-test-1768931145778@example.com';

  console.log('Creating test decision for Feature #135...');

  // Get the user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('❌ Error listing users:', userError.message);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('❌ User not found:', email);
    return;
  }

  console.log('✅ Found user:', user.id);

  // Create a decision
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('❌ Error fetching profile:', profileError.message);
    return;
  }

  // Create profile if it doesn't exist
  if (!profile) {
    const { error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: 'F135 Test User',
        decision_score: 50,
        total_decisions: 0,
        positive_outcome_rate: 0
      });

    if (createProfileError) {
      console.error('❌ Error creating profile:', createProfileError.message);
      return;
    }

    console.log('✅ Profile created');
  }

  // Create the decision
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      title: 'F135 Test Decision - Reminders API',
      status: 'deliberating',
      emotional_state: 'curious',
      category: 'testing',
      recorded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('❌ Error creating decision:', decisionError.message);
    console.error('   Details:', JSON.stringify(decisionError, null, 2));
    return;
  }

  console.log('✅ Decision created successfully!');
  console.log('   Decision ID:', decision.id);
  console.log('   Title:', decision.title);
  console.log('   Status:', decision.status);
  console.log('\nNow you can test reminders for this decision at:');
  console.log(`   http://localhost:5173/decisions/${decision.id}`);
}

createTestDecision().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecision() {
  console.log('Creating test decision with follow_up_date for Feature #263\n');

  const testEmail = 'feature263@test.com';

  try {
    // Get user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const testUser = users.find(u => u.email === testEmail);

    if (!testUser) {
      throw new Error('Test user not found');
    }

    console.log('1. Found user:', testUser.id);

    // Current time in Rome is 23:21 (within quiet hours 22:00-08:00)
    // Create decision with follow_up_date set to NOW (should be hidden during quiet hours)
    const now = new Date();
    console.log('\n2. Current time (UTC):', now.toISOString());
    console.log('   Current time (Rome):', now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
    console.log('   Quiet hours: 22:00-08:00');
    console.log('   Is within quiet hours:', true);

    // Decision 1: Follow-up NOW (within quiet hours - should be HIDDEN)
    const decision1Date = new Date(now);
    const { data: decision1, error: error1 } = await supabase
      .from('decisions')
      .insert({
        user_id: testUser.id,
        title: 'TEST_263_QUIET_HOURS_HIDDEN',
        description: 'This decision has follow_up during quiet hours and should be hidden',
        decided_at: new Date().toISOString(),
        follow_up_date: decision1Date.toISOString()
      })
      .select()
      .single();

    if (error1) throw error1;
    console.log('\n3. Created decision 1 (should be HIDDEN):');
    console.log('   Title:', decision1.title);
    console.log('   Follow-up date:', decision1.follow_up_date);

    // Decision 2: Follow-up 2 hours AGO (before quiet hours started - should be VISIBLE)
    const decision2Date = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago (21:21)
    const { data: decision2, error: error2 } = await supabase
      .from('decisions')
      .insert({
        user_id: testUser.id,
        title: 'TEST_263_BEFORE_QUIET_HOURS_VISIBLE',
        description: 'This decision has follow_up before quiet hours and should be visible',
        decided_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        follow_up_date: decision2Date.toISOString()
      })
      .select()
      .single();

    if (error2) throw error2;
    console.log('\n4. Created decision 2 (should be VISIBLE):');
    console.log('   Title:', decision2.title);
    console.log('   Follow-up date:', decision2.follow_up_date);
    console.log('   Time in Rome:', decision2Date.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));

    console.log('\n=== Test Data Created ===');
    console.log('\nExpected behavior:');
    console.log('- Decision 1 (23:21): HIDDEN - follow_up is within quiet hours');
    console.log('- Decision 2 (21:21): VISIBLE - follow_up was before quiet hours started');
    console.log('\nCheck the Dashboard at http://localhost:5174/dashboard');
    console.log('Only Decision 2 should appear in pending reviews');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestDecision();

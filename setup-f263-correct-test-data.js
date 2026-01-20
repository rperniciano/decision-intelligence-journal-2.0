// Setup CORRECT test data for Feature #263
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupCorrectTestData() {
  console.log('=== Setting up CORRECT Test Data for Feature #263 ===\n');

  const testEmail = 'feature263@test.com';

  try {
    // 1. Get user
    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123',
    });

    console.log('1. User found:', user.id);

    // 2. Delete old test data
    console.log('\n2. Deleting old test data...');
    await supabase
      .from('decisions')
      .delete()
      .eq('user_id', user.id)
      .like('title', 'TEST_263%');
    console.log('   ✓ Old data deleted');

    // 3. Get current time in Rome
    const now = new Date();
    const romeTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Rome', hour12: false });
    const romeTime = new Date(romeTimeStr);
    const romeHour = romeTime.getHours();

    console.log('\n3. Current time in Rome:', romeHour + ':00');

    // 4. Create decision due BEFORE quiet hours (should always show)
    // Due at 10:00 AM today
    const visibleDecisionTime = new Date(romeTime);
    visibleDecisionTime.setHours(10, 0, 0, 0);

    const { data: decision1, error: error1 } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        title: 'TEST_263_VISIBLE_ALWAYS',
        description: 'This decision was due at 10am, BEFORE quiet hours. Should always be visible.',
        status: 'decided',
        decided_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        follow_up_date: visibleDecisionTime.toISOString(),
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error1) throw error1;
    console.log('\n4. Created VISIBLE decision:');
    console.log('   Title:', decision1.title);
    console.log('   Follow-up:', decision1.follow_up_date);
    console.log('   Expected: Always visible (due before 18:00)');

    // 5. Create decision due DURING quiet hours (should be hidden during quiet hours)
    // Due at 18:30 today (during quiet hours 18:00-19:00)
    const hiddenDecisionTime = new Date(romeTime);
    hiddenDecisionTime.setHours(18, 30, 0, 0);

    const { data: decision2, error: error2 } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        title: 'TEST_263_HIDDEN_DURING_QUIET',
        description: 'This decision was due at 6:30pm, DURING quiet hours (18:00-19:00). Should be hidden during quiet hours.',
        status: 'decided',
        decided_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        follow_up_date: hiddenDecisionTime.toISOString(),
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error2) throw error2;
    console.log('\n5. Created HIDDEN decision:');
    console.log('   Title:', decision2.title);
    console.log('   Follow-up:', decision2.follow_up_date);
    console.log('   Expected: Hidden during 18:00-19:00 quiet hours');

    // 6. Set quiet hours to 18:00-19:00
    console.log('\n6. Setting quiet hours to 18:00-19:00...');
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        quiet_hours_start: '18:00',
        quiet_hours_end: '19:00',
        quiet_hours_enabled: true,
        timezone: 'Europe/Rome'
      }
    });
    console.log('   ✓ Quiet hours set to 18:00-19:00');

    // 7. Test the API
    console.log('\n7. Testing API with quiet hours 18:00-19:00...');
    const { data: sessionData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123',
    });
    const accessToken = sessionData.session.access_token;

    const response = await fetch('http://localhost:4001/api/v1/pending-reviews', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();

    console.log('   Pending reviews returned:', data.pendingReviews?.length || 0);
    data.pendingReviews?.forEach(r => {
      console.log('     -', r.decisions?.title);
    });

    // 8. Verify
    console.log('\n8. VERIFICATION:');
    console.log('   Current time in Rome: ~' + romeHour + ':XX');
    console.log('   Quiet hours: 18:00-19:00');
    console.log('   Currently in quiet hours?', romeHour >= 18 && romeHour < 19 ? 'YES' : 'NO');

    if (romeHour >= 18 && romeHour < 19) {
      console.log('\n   EXPECTED (IN QUIET HOURS):');
      console.log('     → TEST_263_VISIBLE_ALWAYS: VISIBLE ✓');
      console.log('     → TEST_263_HIDDEN_DURING_QUIET: HIDDEN');

      if (data.pendingReviews?.length === 1 && data.pendingReviews[0].decisions?.title === 'TEST_263_VISIBLE_ALWAYS') {
        console.log('\n   ✓✓✓ QUIET HOURS FILTERING IS WORKING! ✓✓✓');
      } else if (data.pendingReviews?.length === 2) {
        console.log('\n   ✗✗✗ QUIET HOURS FILTERING NOT WORKING ✗✗✗');
        console.log('   Expected 1 decision, got', data.pendingReviews?.length);
      }
    } else {
      console.log('\n   EXPECTED (OUTSIDE QUIET HOURS):');
      console.log('     → Both decisions should be VISIBLE');

      if (data.pendingReviews?.length === 2) {
        console.log('\n   ✓✓✓ CORRECT: Both decisions visible ✓✓✓');
      } else {
        console.log('\n   ? UNEXPECTED: Got', data.pendingReviews?.length, 'decisions');
      }
    }

    console.log('\n=== Setup Complete ===');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

setupCorrectTestData();

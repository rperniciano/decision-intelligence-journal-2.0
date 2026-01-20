// Final correct test for Feature #263
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalTest() {
  console.log('=== Final Test: Feature #263 ===\n');

  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: 'feature263@test.com',
    password: 'password123',
  });

  // Delete old test data
  console.log('1. Cleaning up...');
  await supabase.from('decisions').delete().eq('user_id', user.id).like('title', 'TEST_263%');

  // Create timestamps in UTC (Rome is UTC+1)
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Decision 1: Due at 09:00 UTC = 10:00 Rome time (BEFORE quiet hours 18:00)
  const decision1Time = new Date(`${today}T09:00:00.000Z`);

  // Decision 2: Due at 17:30 UTC = 18:30 Rome time (DURING quiet hours 18:00-19:00)
  const decision2Time = new Date(`${today}T17:30:00.000Z`);

  console.log('\n2. Creating test decisions...');
  console.log('   Decision 1 (VISIBLE): 09:00 UTC = 10:00 Rome');
  console.log('   Decision 2 (HIDDEN): 17:30 UTC = 18:30 Rome');

  const { data: d1 } = await supabase.from('decisions').insert({
    user_id: user.id,
    title: 'TEST_263_VISIBLE_BEFORE_QUIET',
    status: 'decided',
    decided_at: new Date(Date.now() - 24*60*60*1000).toISOString(),
    follow_up_date: decision1Time.toISOString()
  }).select().single();

  const { data: d2 } = await supabase.from('decisions').insert({
    user_id: user.id,
    title: 'TEST_263_HIDDEN_DURING_QUIET',
    status: 'decided',
    decided_at: new Date(Date.now() - 24*60*60*1000).toISOString(),
    follow_up_date: decision2Time.toISOString()
  }).select().single();

  // Set quiet hours to 18:00-19:00 Rome time
  console.log('\n3. Setting quiet hours to 18:00-19:00 Rome time...');
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      quiet_hours_start: '18:00',
      quiet_hours_end: '19:00',
      quiet_hours_enabled: true,
      timezone: 'Europe/Rome'
    }
  });

  // Test API
  console.log('\n4. Testing API on port 4002...');
  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email: 'feature263@test.com',
    password: 'password123',
  });

  const response = await fetch('http://localhost:4002/api/v1/pending-reviews', {
    headers: { 'Authorization': `Bearer ${sessionData.session.access_token}` }
  });
  const data = await response.json();

  console.log('\n   Pending reviews returned:', data.pendingReviews?.length || 0);
  data.pendingReviews?.forEach(r => console.log('     -', r.decisions?.title));

  console.log('\n5. EXPECTED (currently ~18:XX Rome time, IN quiet hours):');
  console.log('     → TEST_263_VISIBLE_BEFORE_QUIET: SHOW');
  console.log('     → TEST_263_HIDDEN_DURING_QUIET: HIDE');

  if (data.pendingReviews?.length === 1 &&
      data.pendingReviews[0].decisions?.title === 'TEST_263_VISIBLE_BEFORE_QUIET') {
    console.log('\n   ✓✓✓ SUCCESS! QUIET HOURS FILTERING IS WORKING! ✓✓✓');

    // Restore original settings
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
      }
    });

    console.log('\n=== Feature #263 VERIFIED PASSING ===');
    process.exit(0);
  } else {
    console.log('\n   ✗✗✗ FILTERING NOT WORKING ✗✗✗');
    console.log('   Expected 1 decision, got', data.pendingReviews?.length);
    console.log('\n=== Feature #263 STILL FAILING ===');
    process.exit(1);
  }
}

finalTest();

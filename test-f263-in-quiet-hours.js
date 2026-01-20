// Test Feature #263 by simulating quiet hours
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuietHoursFiltering() {
  console.log('=== Testing Feature #263: Quiet Hours Filtering ===\n');

  const testEmail = 'feature263@test.com';

  try {
    // 1. Get user
    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123',
    });

    if (!user) throw new Error('User not found');

    console.log('1. User found:', user.id);
    console.log('   Current quiet hours:', user.user_metadata.quiet_hours_start, '-', user.user_metadata.quiet_hours_end);
    console.log('   Timezone:', user.user_metadata.timezone);

    // 2. Get access token
    const { data: sessionData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123',
    });
    const accessToken = sessionData.session.access_token;
    console.log('   ✓ Got access token');

    // 3. Test with CURRENT quiet hours (should show both since it's 18:20)
    console.log('\n2. Testing with current quiet hours (22:00-08:00)...');
    const response1 = await fetch('http://localhost:4001/api/v1/pending-reviews', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data1 = await response1.json();
    console.log('   Pending reviews:', data1.pendingReviews?.length || 0);
    data1.pendingReviews?.forEach(r => {
      console.log('     -', r.decisions?.title);
    });

    // 4. Change quiet hours to CURRENT TIME (18:00-19:00) to trigger filtering
    console.log('\n3. Changing quiet hours to 18:00-19:00 (simulating current time in quiet hours)...');
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        quiet_hours_start: '18:00',
        quiet_hours_end: '19:00',
        quiet_hours_enabled: true
      }
    });
    console.log('   ✓ Quiet hours updated');

    // 5. Test again - should filter out decisions due during 18:00-19:00
    console.log('\n4. Testing with updated quiet hours (18:00-19:00)...');
    const response2 = await fetch('http://localhost:4001/api/v1/pending-reviews', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data2 = await response2.json();
    console.log('   Pending reviews:', data2.pendingReviews?.length || 0);
    data2.pendingReviews?.forEach(r => {
      console.log('     -', r.decisions?.title);
    });

    // 6. Verify filtering worked
    console.log('\n5. Verification:');
    if (data1.pendingReviews?.length === 2 && data2.pendingReviews?.length === 2) {
      console.log('   ✗ QUIET HOURS FILTERING NOT WORKING');
      console.log('   Expected: One decision should be filtered out during quiet hours');
      console.log('   Actual: Both decisions still showing');
    } else if (data2.pendingReviews?.length < data1.pendingReviews?.length) {
      console.log('   ✓ QUIET HOURS FILTERING IS WORKING!');
      console.log('   Decisions filtered:', data1.pendingReviews?.length - data2.pendingReviews?.length);
    } else {
      console.log('   ? UNCERTAIN - Both responses have the same number of decisions');
    }

    // 7. Restore original quiet hours
    console.log('\n6. Restoring original quiet hours...');
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        quiet_hours_enabled: true
      }
    });
    console.log('   ✓ Original settings restored');

    console.log('\n=== Test Complete ===');
    console.log('\nConclusion:');
    console.log('- Current time: ~18:20 Rome time');
    console.log('- Original quiet hours: 22:00-08:00 (both decisions should show)');
    console.log('- Test quiet hours: 18:00-19:00 (should filter if working)');
    console.log('- Refresh dashboard to see updated results');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testQuietHoursFiltering();

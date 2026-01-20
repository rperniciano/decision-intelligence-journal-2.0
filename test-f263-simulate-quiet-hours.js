// Test Feature #263 by simulating quiet hours
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithSimulatedQuietHours() {
  console.log('=== Testing Feature #263: Simulating Quiet Hours ===\n');

  const testEmail = 'feature263@test.com';

  try {
    // 1. Get user
    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123',
    });

    console.log('1. Original Settings:');
    console.log('   Quiet hours:', user.user_metadata.quiet_hours_start, '-', user.user_metadata.quiet_hours_end);

    // 2. Get access token
    const { data: sessionData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123',
    });
    const accessToken = sessionData.session.access_token;

    // 3. Test with original settings (should show both)
    console.log('\n2. Test with original quiet hours (22:00-08:00):');
    const response1 = await fetch('http://localhost:4001/api/v1/pending-reviews', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data1 = await response1.json();
    console.log('   Pending reviews:', data1.pendingReviews?.length || 0);
    data1.pendingReviews?.forEach(r => console.log('     -', r.decisions?.title));

    // 4. Get current time in user's timezone
    const now = new Date();
    const userTimezone = user.user_metadata.timezone || 'UTC';
    const timeZoneFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const currentTimeStr = timeZoneFormatter.format(now);
    const currentHour = parseInt(currentTimeStr.split(':')[0], 10);

    console.log('\n3. Current time in', userTimezone + ':', currentTimeStr);

    // 5. Set quiet hours to CURRENT HOUR (simulating being in quiet hours)
    // Set quiet hours from current hour to current hour + 1
    const quietStart = `${currentHour.toString().padStart(2, '0')}:00`;
    const quietEnd = `${((currentHour + 1) % 24).toString().padStart(2, '0')}:00`;

    console.log('\n4. Simulating quiet hours:', quietStart, '-', quietEnd);
    console.log('   (This simulates current time being within quiet hours)');

    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        quiet_hours_enabled: true
      }
    });

    // 6. Test with simulated quiet hours
    console.log('\n5. Test with simulated quiet hours (' + quietStart + '-' + quietEnd + '):');
    const response2 = await fetch('http://localhost:4001/api/v1/pending-reviews', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data2 = await response2.json();
    console.log('   Pending reviews:', data2.pendingReviews?.length || 0);
    data2.pendingReviews?.forEach(r => console.log('     -', r.decisions?.title));

    // 7. Analyze results
    console.log('\n6. Analysis:');
    console.log('   Original count:', data1.pendingReviews?.length || 0);
    console.log('   During quiet hours count:', data2.pendingReviews?.length || 0);

    const originalCount = data1.pendingReviews?.length || 0;
    const quietHoursCount = data2.pendingReviews?.length || 0;

    if (quietHoursCount < originalCount) {
      console.log('   ✓ QUIET HOURS FILTERING IS WORKING!');
      console.log('   Decisions filtered:', originalCount - quietHoursCount);
      console.log('\n   During quiet hours, decisions due during the quiet period are hidden.');
    } else if (quietHoursCount === originalCount) {
      console.log('   ✗ QUIET HOURS FILTERING MAY NOT BE WORKING');
      console.log('   Expected: Some decisions should be filtered during quiet hours');
      console.log('   Actual: Same number of decisions showing');
    } else {
      console.log('   ? UNEXPECTED: More decisions during quiet hours?');
    }

    // 8. Restore original settings
    console.log('\n7. Restoring original settings...');
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        quiet_hours_enabled: true
      }
    });
    console.log('   ✓ Settings restored');

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWithSimulatedQuietHours();

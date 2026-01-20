// Detailed debug for Feature #263 filtering logic
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Copy the exact functions from server.ts
function parseTimeString(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function getTodayTimeAt(timeStr, timezone) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const result = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  result.setHours(hours, minutes, 0, 0);
  return result;
}

async function detailedDebug() {
  console.log('=== Detailed Debug: Feature #263 ===\n');

  const testEmail = 'feature263@test.com';

  try {
    // 1. Get user
    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123',
    });

    const metadata = user.user_metadata || {};
    const userTimezone = metadata.timezone || 'UTC';

    // 2. Get current time
    const now = new Date();
    const timeZoneFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const currentTimeStr = timeZoneFormatter.format(now);

    console.log('Current Time Analysis:');
    console.log('  UTC:', now.toISOString());
    console.log('  User timezone (' + userTimezone + '):', currentTimeStr);

    // 3. Set quiet hours to CURRENT HOUR to trigger filtering
    const currentHour = parseInt(currentTimeStr.split(':')[0], 10);
    const quietStart = `${currentHour.toString().padStart(2, '0')}:00`;
    const quietEnd = `${((currentHour + 1) % 24).toString().padStart(2, '0')}:00`;

    console.log('\nSetting quiet hours to:', quietStart, '-', quietEnd);
    console.log('(Current time is within this range, so filtering should trigger)');

    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...metadata,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        quiet_hours_enabled: true
      }
    });

    // 4. Get test decisions
    const { data: decisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user.id)
      .like('title', 'TEST_263%');

    console.log('\nTest Decisions:');
    decisions.forEach(d => {
      const followUpAt = new Date(d.follow_up_date);

      console.log('\n  Decision:', d.title);
      console.log('    Follow-up date:', d.follow_up_date);
      console.log('    Follow-up (parsed):', followUpAt.toISOString());

      // Apply the same filtering logic as the server
      const todayQuietStart = getTodayTimeAt(quietStart, userTimezone);
      const todayQuietEnd = getTodayTimeAt(quietEnd, userTimezone);

      const quietStartTimestamp = parseTimeString(quietStart);
      const quietEndTimestamp = parseTimeString(quietEnd);
      const spansMidnight = quietEndTimestamp < quietStartTimestamp;

      console.log('    Quiet start (today):', todayQuietStart.toISOString());
      console.log('    Quiet end (today):', todayQuietEnd.toISOString());
      console.log('    Spans midnight?', spansMidnight);

      let shouldShow;
      if (spansMidnight) {
        const yesterdayQuietStart = new Date(todayQuietStart);
        yesterdayQuietStart.setDate(yesterdayQuietStart.getDate() - 1);
        console.log('    Quiet start (yesterday):', yesterdayQuietStart.toISOString());
        shouldShow = followUpAt < yesterdayQuietStart;
        console.log('    followUpAt < yesterdayQuietStart?', followUpAt < yesterdayQuietStart);
      } else {
        shouldShow = followUpAt < todayQuietStart;
        console.log('    followUpAt < todayQuietStart?', followUpAt < todayQuietStart);
      }

      console.log('    SHOULD SHOW?', shouldShow);
    });

    // 5. Call API to see what it returns
    console.log('\nAPI Call:');
    const { data: sessionData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123',
    });
    const accessToken = sessionData.session.access_token;

    const response = await fetch('http://localhost:4001/api/v1/pending-reviews', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();

    console.log('  Pending reviews returned:', data.pendingReviews?.length || 0);
    data.pendingReviews?.forEach(r => {
      console.log('    -', r.decisions?.title);
    });

    // 6. Restore settings
    console.log('\nRestoring settings...');
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...metadata,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        quiet_hours_enabled: true
      }
    });

    console.log('\n=== Debug Complete ===');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

detailedDebug();

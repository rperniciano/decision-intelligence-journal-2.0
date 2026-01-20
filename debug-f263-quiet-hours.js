// Debug script for Feature #263
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions from server.ts
function parseTimeString(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function isInQuietHours(currentTimeStr, quietStart, quietEnd) {
  const currentMinutes = parseTimeString(currentTimeStr);
  const startMinutes = parseTimeString(quietStart);
  const endMinutes = parseTimeString(quietEnd);

  if (endMinutes < startMinutes) {
    // Quiet hours span midnight (e.g., 22:00 to 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Quiet hours within same day (e.g., 01:00 to 05:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

function getTodayTimeAt(timeStr, timezone) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const result = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  result.setHours(hours, minutes, 0, 0);
  return result;
}

async function debugQuietHours() {
  console.log('=== Debugging Feature #263 ===\n');

  const testEmail = 'feature263@test.com';

  try {
    // 1. Get user
    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123',
    });

    const metadata = user.user_metadata || {};
    console.log('1. User Settings:');
    console.log('   Quiet hours enabled:', metadata.quiet_hours_enabled);
    console.log('   Quiet hours start:', metadata.quiet_hours_start || '22:00');
    console.log('   Quiet hours end:', metadata.quiet_hours_end || '08:00');
    console.log('   Timezone:', metadata.timezone || 'UTC');

    // 2. Get current time
    const now = new Date();
    const userTimezone = metadata.timezone || 'UTC';
    const timeZoneFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const currentTimeStr = timeZoneFormatter.format(now);

    console.log('\n2. Current Time:');
    console.log('   UTC:', now.toISOString());
    console.log('   User timezone:', currentTimeStr);

    // 3. Test quiet hours calculation
    const quietHoursStart = metadata.quiet_hours_start || '22:00';
    const quietHoursEnd = metadata.quiet_hours_end || '08:00';
    const quietHoursEnabled = metadata.quiet_hours_enabled !== false;

    const isCurrentlyQuietHours = quietHoursEnabled && isInQuietHours(currentTimeStr, quietHoursStart, quietHoursEnd);

    console.log('\n3. Quiet Hours Calculation:');
    console.log('   Start:', quietHoursStart);
    console.log('   End:', quietHoursEnd);
    console.log('   Enabled:', quietHoursEnabled);
    console.log('   Is currently quiet hours?', isCurrentlyQuietHours);

    // 4. Get test decisions
    console.log('\n4. Test Decisions:');
    const { data: decisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user.id)
      .like('title', 'TEST_263%');

    decisions.forEach(d => {
      console.log('\n   Decision:', d.title);
      console.log('   - Follow-up date:', d.follow_up_date);
      console.log('   - Status:', d.status);
      console.log('   - Outcome:', d.outcome || 'None');

      const followUpAt = new Date(d.follow_up_date);

      if (isCurrentlyQuietHours && quietHoursEnabled) {
        const todayQuietStart = getTodayTimeAt(quietHoursStart, userTimezone);
        const todayQuietEnd = getTodayTimeAt(quietHoursEnd, userTimezone);

        const quietStartTimestamp = parseTimeString(quietHoursStart);
        const quietEndTimestamp = parseTimeString(quietHoursEnd);
        const spansMidnight = quietEndTimestamp < quietStartTimestamp;

        const shouldShow = spansMidnight
          ? (followUpAt < todayQuietStart || now >= todayQuietEnd)
          : (followUpAt < todayQuietStart || now >= todayQuietEnd);

        console.log('   - Quiet hours filtering: ACTIVE');
        console.log('     Spans midnight?', spansMidnight);
        console.log('     Today quiet start:', todayQuietStart.toISOString());
        console.log('     Today quiet end:', todayQuietEnd.toISOString());
        console.log('     Follow-up < quiet start?', followUpAt < todayQuietStart);
        console.log('     Now >= quiet end?', now >= todayQuietEnd);
        console.log('     SHOULD SHOW?', shouldShow);
      } else {
        console.log('   - Quiet hours filtering: INACTIVE (not in quiet hours)');
        console.log('     SHOULD SHOW: YES (all decisions shown)');
      }
    });

    console.log('\n5. API Call Test:');
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

    console.log('\n=== Debug Complete ===');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

debugQuietHours();

// Trace the exact logic
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseTimeString(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function isInQuietHours(currentTimeStr, quietStart, quietEnd) {
  const currentMinutes = parseTimeString(currentTimeStr);
  const startMinutes = parseTimeString(quietStart);
  const endMinutes = parseTimeString(quietEnd);

  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

async function traceLogic() {
  console.log('=== Tracing Quiet Hours Logic ===\n');

  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: 'feature263@test.com',
    password: 'password123',
  });

  const metadata = user.user_metadata || {};

  // Get current time
  const now = new Date();
  const userTimezone = metadata.timezone || 'UTC';
  const timeZoneFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const currentTimeStr = timeZoneFormatter.format(now);

  console.log('1. Current Time:');
  console.log('   UTC:', now.toISOString());
  console.log('   User timezone:', currentTimeStr);

  // Get quiet hours settings
  const quietHoursStart = metadata.quiet_hours_start || '22:00';
  const quietHoursEnd = metadata.quiet_hours_end || '08:00';
  const quietHoursEnabled = metadata.quiet_hours_enabled !== false;

  console.log('\n2. Quiet Hours Settings:');
  console.log('   Start:', quietHoursStart);
  console.log('   End:', quietHoursEnd);
  console.log('   Enabled:', quietHoursEnabled);

  // Check if currently in quiet hours
  const isCurrentlyQuietHours = quietHoursEnabled && isInQuietHours(currentTimeStr, quietHoursStart, quietHoursEnd);

  console.log('\n3. Is Currently In Quiet Hours?');
  console.log('   ', isCurrentlyQuietHours);

  if (!isCurrentlyQuietHours) {
    console.log('\n   ✗ NOT IN QUIET HOURS - Filtering will NOT be applied!');
    console.log('   This explains why both decisions are showing.');
  } else {
    console.log('\n   ✓ IN QUIET HOURS - Filtering SHOULD be applied...');
  }

  console.log('\n=== Trace Complete ===');
}

traceLogic();

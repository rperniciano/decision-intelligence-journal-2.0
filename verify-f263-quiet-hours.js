// Quick verification script for Feature #263
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyFeature263() {
  console.log('=== Feature #263 Verification ===\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Get test user
    console.log('1. Getting test user...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const testUser = users.find(u => u.email === 'feature263@test.com');

    if (!testUser) {
      console.log('   ✗ Test user not found');
      return;
    }
    console.log('   ✓ User found:', testUser.id);

    // 2. Check user metadata
    console.log('\n2. Checking user metadata...');
    const metadata = testUser.user_metadata || {};
    console.log('   Quiet hours enabled:', metadata.quiet_hours_enabled);
    console.log('   Quiet hours start:', metadata.quiet_hours_start || '22:00 (default)');
    console.log('   Quiet hours end:', metadata.quiet_hours_end || '08:00 (default)');
    console.log('   Timezone:', metadata.timezone || 'UTC (default)');

    // 3. Check for test decisions
    console.log('\n3. Checking test decisions...');
    const { data: decisions, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', testUser.id)
      .like('title', 'TEST_263%');

    if (error) throw error;

    console.log(`   Found ${decisions.length} test decisions`);
    decisions.forEach(d => {
      console.log(`   - ${d.title}`);
      console.log(`     Status: ${d.status}`);
      console.log(`     Follow-up date: ${d.follow_up_date}`);
      console.log(`     Outcome: ${d.outcome || 'Not recorded'}`);
    });

    // 4. Current time analysis
    console.log('\n4. Current time analysis:');
    const now = new Date();
    console.log('   Current UTC time:', now.toISOString());

    // Get Rome time
    const romeTimeStr = new Date().toLocaleString('en-US', {
      timeZone: 'Europe/Rome',
      hour12: false
    });
    console.log('   Current Rome time:', romeTimeStr);

    // Parse Rome time
    const romeTime = new Date(romeTimeStr);
    const romeHour = romeTime.getHours();
    const romeMinute = romeTime.getMinutes();
    const currentTimeNum = romeHour * 60 + romeMinute;

    // Quiet hours: 22:00 (1320 min) to 08:00 (480 min)
    const quietStart = 22 * 60; // 22:00
    const quietEnd = 8 * 60; // 08:00

    let isQuietHours = false;
    if (quietStart < quietEnd) {
      // Same day (e.g., 08:00-22:00)
      isQuietHours = currentTimeNum >= quietStart && currentTimeNum < quietEnd;
    } else {
      // Spans midnight (e.g., 22:00-08:00)
      isQuietHours = currentTimeNum >= quietStart || currentTimeNum < quietEnd;
    }

    console.log('   Quiet hours: 22:00-08:00');
    console.log('   Currently in quiet hours:', isQuietHours ? 'YES' : 'NO');

    // 5. Expected behavior
    console.log('\n5. Expected behavior:');
    if (isQuietHours) {
      console.log('   Currently IN quiet hours');
      console.log('   → TEST_263_QUIET_HOURS_HIDDEN should NOT appear in pending reviews');
      console.log('   → TEST_263_BEFORE_QUIET_HOURS_VISIBLE should appear');
    } else {
      console.log('   Currently OUTSIDE quiet hours');
      console.log('   → Both decisions should appear in pending reviews');
    }

    console.log('\n=== Verification Complete ===');
    console.log('\nTo manually verify in browser:');
    console.log('1. Login at http://localhost:5173/login');
    console.log('2. Check Dashboard "Pending Reviews" section');
    console.log('3. Verify the expected behavior above');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyFeature263();

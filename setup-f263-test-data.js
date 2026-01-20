// Setup test data for Feature #263: Quiet hours respected for notifications
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTestData() {
  console.log('=== Setting up Feature #263 Test Data ===\n');

  const testEmail = 'feature263@test.com';
  const testPassword = 'password123';

  try {
    // 1. Find or create test user
    console.log('1. Finding test user...');
    let testUser = null;

    try {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      testUser = users.find(u => u.email === testEmail);
    } catch (e) {
      console.log('   Could not list users, trying to sign in...');
    }

    if (!testUser) {
      try {
        // Try to sign in - if user exists, we'll get their ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        if (!signInError && signInData.user) {
          testUser = signInData.user;
          console.log('   ✓ Found existing user via sign in');
        }
      } catch (e) {
        console.log('   Sign in failed:', e.message);
      }
    } else {
      console.log('   ✓ Found existing user');
    }

    if (!testUser) {
      console.log('   Creating test user...');
      const { data, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Feature 263 Test User',
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'Europe/Rome'
        }
      });

      if (error) throw error;
      testUser = data.user;
      console.log('   ✓ User created');
    }

    // Update metadata to ensure quiet hours are set
    await supabase.auth.admin.updateUserById(testUser.id, {
      user_metadata: {
        name: 'Feature 263 Test User',
        quiet_hours_enabled: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        timezone: 'Europe/Rome'
      }
    });
    console.log('   ✓ User metadata updated');

    // 2. Delete existing test decisions
    console.log('\n2. Cleaning up old test data...');
    const { data: oldDecisions } = await supabase
      .from('decisions')
      .delete()
      .eq('user_id', testUser.id)
      .like('title', 'TEST_263%');
    console.log('   ✓ Old test decisions deleted');

    // 3. Get current time in Rome
    const now = new Date();
    const romeTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Rome', hour12: false });
    const romeTime = new Date(romeTimeStr);
    const romeHour = romeTime.getHours();
    const romeMinute = romeTime.getMinutes();
    const currentTimeNum = romeHour * 60 + romeMinute;

    console.log('\n3. Current time analysis:');
    console.log('   Current Rome time:', romeTimeStr);
    console.log('   Rome hour:', romeHour);

    // 4. Create test decision that should be VISIBLE (due before quiet hours started)
    console.log('\n4. Creating test decision VISIBLE (due before quiet hours)...');

    // If it's after 8am, create a decision due at 7am today
    // If it's before 8am, create a decision due yesterday at 7am
    let visibleFollowUpDate = new Date(romeTime);
    visibleFollowUpDate.setHours(7, 0, 0, 0); // 7:00 AM
    if (romeHour >= 8) {
      // It's after 8am, so 7am today is before current time and before quiet hours start
    } else {
      // It's before 8am, so 7am yesterday is before quiet hours started
      visibleFollowUpDate.setDate(visibleFollowUpDate.getDate() - 1);
    }

    const { data: decision1, error: error1 } = await supabase
      .from('decisions')
      .insert({
        user_id: testUser.id,
        title: 'TEST_263_BEFORE_QUIET_HOURS_VISIBLE',
        description: 'This decision should be visible because it was due before quiet hours started',
        status: 'decided',
        decided_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Decided yesterday
        follow_up_date: visibleFollowUpDate.toISOString(),
        // No outcome - this makes it a pending review
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error1) throw error1;
    console.log('   ✓ Decision 1 created:', decision1.id);
    console.log('     Title:', decision1.title);
    console.log('     Follow-up date:', decision1.follow_up_date);

    // 5. Create test decision that should be HIDDEN during quiet hours
    console.log('\n5. Creating test decision HIDDEN (due during quiet hours)...');

    // Create a decision due at 11pm (23:00) yesterday - during quiet hours
    let hiddenFollowUpDate = new Date(romeTime);
    hiddenFollowUpDate.setDate(hiddenFollowUpDate.getDate() - 1); // Yesterday
    hiddenFollowUpDate.setHours(23, 0, 0, 0); // 11:00 PM (during quiet hours)

    const { data: decision2, error: error2 } = await supabase
      .from('decisions')
      .insert({
        user_id: testUser.id,
        title: 'TEST_263_QUIET_HOURS_HIDDEN',
        description: 'This decision should be hidden during quiet hours because it was due at 11pm',
        status: 'decided',
        decided_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // Decided 2 days ago
        follow_up_date: hiddenFollowUpDate.toISOString(),
        // No outcome - this makes it a pending review
        created_at: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error2) throw error2;
    console.log('   ✓ Decision 2 created:', decision2.id);
    console.log('     Title:', decision2.title);
    console.log('     Follow-up date:', decision2.follow_up_date);

    // 6. Summary
    console.log('\n6. Expected behavior:');
    const quietStart = 22 * 60; // 22:00
    const quietEnd = 8 * 60; // 08:00
    let isQuietHours = (quietStart < quietEnd)
      ? (currentTimeNum >= quietStart && currentTimeNum < quietEnd)
      : (currentTimeNum >= quietStart || currentTimeNum < quietEnd);

    console.log('   Current time in Rome:', `${romeHour}:${romeMinute.toString().padStart(2, '0')}`);
    console.log('   Quiet hours: 22:00-08:00');
    console.log('   Currently in quiet hours:', isQuietHours ? 'YES ⚠️' : 'NO ✓');

    if (isQuietHours) {
      console.log('\n   EXPECTED ON DASHBOARD:');
      console.log('   → TEST_263_BEFORE_QUIET_HOURS_VISIBLE: VISIBLE ✓');
      console.log('   → TEST_263_QUIET_HOURS_HIDDEN: HIDDEN (filtered out)');
    } else {
      console.log('\n   EXPECTED ON DASHBOARD:');
      console.log('   → TEST_263_BEFORE_QUIET_HOURS_VISIBLE: VISIBLE ✓');
      console.log('   → TEST_263_QUIET_HOURS_HIDDEN: VISIBLE ✓ (outside quiet hours)');
    }

    console.log('\n=== Setup Complete ===\n');
    console.log('Login credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('\nNavigate to: http://localhost:5173/dashboard');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

setupTestData();

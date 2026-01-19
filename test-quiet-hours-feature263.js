// Test script for Feature #263: Quiet hours respected for notifications
// This script creates test data to verify quiet hours functionality

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuietHours() {
  console.log('=== Feature #263: Quiet Hours Test ===\n');

  const testEmail = 'feature263@test.com';
  const testPassword = 'password123';

  try {
    // 1. Find or create test user
    console.log('1. Looking for test user...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let testUser = users.find(u => u.email === testEmail);

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
      console.log('   ✓ User created:', testUser.id);
    } else {
      console.log('   ✓ Found existing user:', testUser.id);
    }

    // 2. Update user settings with quiet hours
    console.log('\n2. Setting quiet hours (10pm-8am)...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      testUser.id,
      {
        user_metadata: {
          ...testUser.user_metadata,
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'Europe/Rome'
        }
      }
    );

    if (updateError) throw updateError;
    console.log('   ✓ Quiet hours configured');

    // 3. Get the user's access token for API calls
    console.log('\n3. Getting access token...');
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (sessionError) throw sessionError;
    const accessToken = sessionData.session.access_token;
    console.log('   ✓ Access token obtained');

    // 4. Create a test decision
    console.log('\n4. Creating test decision...');
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: testUser.id,
        title: 'TEST_263_QUIET_HOURS_DECISION',
        description: 'Testing quiet hours functionality',
        decided_at: new Date().toISOString()
      })
      .select()
      .single();

    if (decisionError) throw decisionError;
    console.log('   ✓ Decision created:', decision.id);

    // 5. Create a reminder for NOW (should show immediately outside quiet hours)
    console.log('\n5. Creating reminder for NOW...');
    const now = new Date();
    const { data: reminder, error: reminderError } = await supabase
      .from('DecisionsFollowUpReminders')
      .insert({
        user_id: testUser.id,
        decision_id: decision.id,
        remind_at: now.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (reminderError) throw reminderError;
    console.log('   ✓ Reminder created for:', now.toISOString());

    // 6. Check pending reviews via API
    console.log('\n6. Checking /pending-reviews endpoint...');
    const fetch = (await import('node-fetch')).default;
    const apiResponse = await fetch('http://localhost:4006/api/v1/pending-reviews', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const apiData = await apiResponse.json();
    console.log('   Response status:', apiResponse.status);
    console.log('   Pending reviews count:', apiData.pendingReviews?.length || 0);

    if (apiData.pendingReviews && apiData.pendingReviews.length > 0) {
      console.log('   ✓ Reminder shows in pending reviews (current time is outside quiet hours)');
    } else {
      console.log('   ! Reminder NOT showing (current time may be within quiet hours)');
    }

    // 7. Test quiet hours settings endpoint
    console.log('\n7. Testing GET /settings endpoint...');
    const settingsResponse = await fetch('http://localhost:4006/api/v1/profile/settings', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const settingsData = await settingsResponse.json();
    console.log('   Settings response:', JSON.stringify(settingsData, null, 2));

    console.log('\n=== Test Complete ===');
    console.log('\nTest User Credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('User ID:', testUser.id);
    console.log('Decision ID:', decision.id);
    console.log('Reminder ID:', reminder.id);

    console.log('\nTo manually test in browser:');
    console.log('1. Login at http://localhost:5174/login');
    console.log('2. Check Dashboard for pending reviews');
    console.log('3. Current time in Europe/Rome determines if reminder shows');
    console.log('4. Quiet hours: 22:00-08:00 (10pm-8am)');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testQuietHours();

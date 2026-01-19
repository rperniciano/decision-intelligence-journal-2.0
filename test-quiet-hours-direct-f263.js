// Test script for Feature #263: Quiet hours respected for notifications
// Using Supabase client for authentication

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testQuietHours() {
  console.log('=== Feature #263: Quiet Hours Test ===\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const testEmail = 'feature263@test.com';
  const testPassword = 'password123';

  try {
    // 1. Sign in to get access token
    console.log('1. Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) throw signInError;

    const accessToken = signInData.session.access_token;
    console.log('   ✓ Signed in');

    // 2. Check settings endpoint
    console.log('\n2. Checking GET /profile/settings endpoint...');
    const settingsResponse = await fetch('http://localhost:4008/api/v1/profile/settings', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const settingsData = await settingsResponse.json();
    console.log('   Response status:', settingsResponse.status);
    console.log('   Settings:', JSON.stringify(settingsData.settings || settingsData, null, 2));

    // 3. Check pending reviews
    console.log('\n3. Checking GET /pending-reviews endpoint...');
    const pendingResponse = await fetch('http://localhost:4008/api/v1/pending-reviews', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const pendingData = await pendingResponse.json();
    console.log('   Response status:', pendingResponse.status);
    console.log('   Pending reviews count:', pendingData.pendingReviews?.length || 0);

    if (pendingData.pendingReviews && pendingData.pendingReviews.length > 0) {
      console.log('   Reviews found:');
      pendingData.pendingReviews.forEach(r => {
        console.log('     -', r.decisions?.title || 'No title', '(due:', r.remind_at + ')');
      });
    }

    // 4. Display current time info
    console.log('\n4. Current time analysis:');
    const now = new Date();
    console.log('   Current UTC time:', now.toISOString());
    console.log('   User timezone: Europe/Rome');
    const romeTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' });
    console.log('   Current Rome time:', romeTime);

    console.log('\n=== Test Complete ===');
    console.log('Quiet hours: 22:00-08:00 (10pm-8am)');
    console.log('If current Rome time is within 22:00-08:00, reminders due during that period should be hidden');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testQuietHours();

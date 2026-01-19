// Test script for Feature #263: Quiet hours respected for notifications
// This script uses the API to test quiet hours functionality

require('dotenv').config();

async function testQuietHours() {
  console.log('=== Feature #263: Quiet Hours Test ===\n');

  const testEmail = 'feature263@test.com';
  const testPassword = 'password123';

  try {
    // 1. Login to get access token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:4006/api/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.token;
    console.log('   ✓ Logged in');

    // 2. Check settings endpoint
    console.log('\n2. Checking /settings endpoint...');
    const settingsResponse = await fetch('http://localhost:4006/api/v1/profile/settings', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const settingsData = await settingsResponse.json();
    console.log('   Settings:', JSON.stringify(settingsData.settings, null, 2));

    // 3. Check pending reviews
    console.log('\n3. Checking /pending-reviews endpoint...');
    const pendingResponse = await fetch('http://localhost:4006/api/v1/pending-reviews', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const pendingData = await pendingResponse.json();
    console.log('   Pending reviews:', pendingData.pendingReviews?.length || 0);

    if (pendingData.pendingReviews && pendingData.pendingReviews.length > 0) {
      console.log('   Reviews found:');
      pendingData.pendingReviews.forEach(r => {
        console.log('     -', r.decisions.title, '(due:', r.remind_at + ')');
      });
    }

    console.log('\n=== Test Complete ===');
    console.log('\nCurrent time determines if reminders show during quiet hours (10pm-8am)');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testQuietHours();

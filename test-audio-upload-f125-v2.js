/**
 * Feature #125: Audio upload goes to storage endpoint
 * Test via Vite proxy (which is how the frontend accesses it)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const API_URL = 'http://localhost:5173/api/v1'; // Via Vite proxy

async function testAudioUpload() {
  console.log('Testing Feature #125: Audio upload to /api/v1/recordings/upload');
  console.log('(Testing via Vite proxy at localhost:5173)');
  console.log('='.repeat(60));

  const email = 'test_f125@example.com';
  const password = 'test123456';

  // Step 1: Sign in to get auth token
  console.log('\n[1/4] Signing in test user...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('❌ Sign in failed:', authError.message);
    return false;
  }

  const token = authData.session.access_token;
  console.log('✅ Signed in successfully');

  // Step 2: Create mock audio file (minimal valid webm audio)
  console.log('\n[2/4] Creating mock audio file...');
  const mockAudioBuffer = Buffer.from([
    // WebM header
    0x1A, 0x45, 0xDF, 0xA3,
    0x01, 0x00, 0x00, 0x00,
    0x42, 0x86, 0x81, 0x01,
    0x42, 0x82, 0x88, 0x77, 0x65, 0x62, 0x6D,
    // Some audio data to make it non-empty
    0x00, 0x00, 0x00, 0x00
  ]);

  const formData = new FormData();
  const blob = new Blob([mockAudioBuffer], { type: 'audio/webm' });
  formData.append('file', blob, 'test-recording.webm');
  console.log('✅ Mock audio file created (size:', mockAudioBuffer.length, 'bytes)');

  // Step 3: Upload to API endpoint via Vite proxy
  console.log('\n[3/4] Uploading to /api/v1/recordings/upload...');
  console.log('API URL:', API_URL);

  try {
    const response = await fetch(`${API_URL}/recordings/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed');
      console.error('Error response:', errorText.substring(0, 500));
      return false;
    }

    const result = await response.json();
    console.log('✅ Upload successful!');
    console.log('Response:', JSON.stringify(result, null, 2));

    // Step 4: Verify response structure
    console.log('\n[4/4] Verifying response structure...');

    const checks = {
      'Has jobId': !!result.jobId,
      'Has status': !!result.status,
      'Status is valid': result.status === 'processing' || result.status === 'pending' || result.status === 'uploaded',
    };

    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    });

    const allPassed = Object.values(checks).every(v => v);

    if (allPassed) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 Feature #125: PASSED ✅');
      console.log('='.repeat(60));
      console.log('\nVerification Summary:');
      console.log('- ✅ POST to /api/v1/recordings/upload successful');
      console.log('- ✅ Audio file in request body (FormData)');
      console.log('- ✅ Response includes jobId');
      console.log('- ✅ Response includes status');
      return true;
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌ Feature #125: FAILED - Some checks did not pass');
      console.log('='.repeat(60));
      return false;
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  } finally {
    await supabase.auth.signOut();
  }
}

// Run the test
testAudioUpload()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });

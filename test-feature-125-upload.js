// Test script for Feature #125: Audio upload returns audio URL
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:4001';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testAudioUpload() {
  console.log('🧪 Testing Feature #125: Audio upload returns audio URL\n');

  // 1. Create a test user and get auth token
  console.log('Step 1: Creating test user...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email: `f125-test-${Date.now()}@example.com`,
    password: 'TestPass123!',
  });

  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message);
    return;
  }

  console.log('✅ User created:', user.email);

  // 2. Get session token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('❌ Failed to get session');
    return;
  }

  const token = session.access_token;
  console.log('✅ Auth token obtained\n');

  // 3. Create a small test audio file (1KB of dummy data)
  console.log('Step 2: Creating test audio file...');
  const testAudioBuffer = Buffer.from('dummy audio data for testing');
  console.log('✅ Test audio created:', testAudioBuffer.length, 'bytes\n');

  // 4. Upload the audio
  console.log('Step 3: Uploading audio to /api/v1/recordings/upload...');
  const form = new FormData();
  form.append('file', new Blob([testAudioBuffer], { type: 'audio/webm' }), 'test-recording.webm');

  const response = await fetch(`${API_URL}/api/v1/recordings/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: form,
  });

  const responseData = await response.json();
  console.log('Response status:', response.status);
  console.log('Response body:', JSON.stringify(responseData, null, 2));

  // 5. Verify the response
  console.log('\nStep 4: Verifying response...\n');

  const checks = [
    {
      name: 'POST to /api/v1/recordings/upload',
      pass: response.url.includes('/recordings/upload') || response.status === 202,
    },
    {
      name: 'Response includes audio URL',
      pass: !!responseData.audioUrl,
    },
    {
      name: 'Audio URL is a valid URL',
      pass: responseData.audioUrl && (responseData.audioUrl.startsWith('http://') || responseData.audioUrl.startsWith('https://')),
    },
    {
      name: 'Response includes jobId',
      pass: !!responseData.jobId,
    },
    {
      name: 'Response includes status',
      pass: !!responseData.status,
    },
  ];

  let allPassed = true;
  checks.forEach((check, index) => {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${check.name}`);
    if (!check.pass) allPassed = false;
  });

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ Feature #125: ALL CHECKS PASSED\n');
    console.log('The upload endpoint correctly returns an audio URL.');
  } else {
    console.log('❌ Feature #125: SOME CHECKS FAILED\n');
    console.log('The upload endpoint does not meet all requirements.');
  }
  console.log('='.repeat(60));
}

testAudioUpload().catch(console.error);

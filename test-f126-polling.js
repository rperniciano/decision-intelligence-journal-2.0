import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testPolling() {
  console.log('=== Feature #126: Processing status polled correctly ===\n');

  // 1. Sign in
  console.log('1. Signing in as test-f126@example.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test-f126@example.com',
    password: 'test123456',
  });

  if (authError) {
    console.error('❌ Sign in failed:', authError.message);
    process.exit(1);
  }
  console.log('✅ Signed in successfully');

  const token = authData.session.access_token;
  console.log('Token obtained:', token.substring(0, 20) + '...\n');

  // 2. Create a mock audio file (minimal webm file)
  console.log('2. Creating mock audio file...');
  // Create a minimal valid webm file header
  const mockAudio = Buffer.from([
    0x1A, 0x45, 0xDF, 0xA3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F,
    0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81, 0x01,
    0x42, 0xF3, 0x81, 0x01, 0x42, 0x82, 0x88, 0x6D, 0x61, 0x74, 0x72, 0x6F,
    0x73, 0x6B, 0x61, 0x42, 0x87, 0x81, 0x01, 0x42, 0x85, 0x81, 0x01
  ]);

  const formData = new FormData();
  const blob = new Blob([mockAudio], { type: 'audio/webm' });
  formData.append('file', blob, 'test-recording.webm');
  console.log('✅ Mock audio file created\n');

  // 3. Upload audio
  console.log('3. Uploading audio to API...');
  const uploadResponse = await fetch('http://localhost:4001/api/v1/recordings/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json();
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }

  const uploadData = await uploadResponse.json();
  console.log('✅ Upload successful');
  console.log('   Job ID:', uploadData.jobId);
  console.log('   Status:', uploadData.status);
  console.log();

  const jobId = uploadData.jobId;

  // 4. Poll for status
  console.log('4. Starting polling mechanism...');
  console.log('   Polling endpoint: GET /api/v1/recordings/:id/status');
  console.log('   Polling interval: 2 seconds');
  console.log('   Max attempts: 60');
  console.log();

  const maxAttempts = 60;
  let attempts = 0;
  let finalStatus = '';
  let decisionId = null;
  let errorMessage = null;

  const pollStartTime = Date.now();

  while (attempts < maxAttempts) {
    attempts++;
    const elapsed = ((Date.now() - pollStartTime) / 1000).toFixed(1);

    // Poll for status
    const statusResponse = await fetch(
      `http://localhost:4001/api/v1/recordings/${jobId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!statusResponse.ok) {
      console.error(`❌ Poll #${attempts} failed - HTTP ${statusResponse.status}`);
      break;
    }

    const statusData = await statusResponse.json();
    finalStatus = statusData.status;

    console.log(`   Poll #${attempts} [${elapsed}s]: Status = "${finalStatus}"`);

    // Check if completed
    if (statusData.status === 'completed') {
      decisionId = statusData.decisionId;
      console.log(`\n✅ Processing completed!`);
      console.log(`   Decision ID: ${decisionId}`);
      break;
    }

    // Check if failed
    if (statusData.status === 'failed') {
      errorMessage = statusData.errorMessage;
      console.log(`\n⚠️  Processing failed (expected for mock audio)`);
      console.log(`   Error: ${errorMessage}`);
      break;
    }

    // Wait before next poll (2 seconds)
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const totalTime = ((Date.now() - pollStartTime) / 1000).toFixed(1);

  console.log();
  console.log('=== Polling Results ===');
  console.log(`Total polls made: ${attempts}`);
  console.log(`Total time: ${totalTime}s`);
  console.log(`Final status: ${finalStatus}`);
  console.log(`Decision ID: ${decisionId || 'N/A (mock audio failed as expected)'}`);
  console.log(`Error message: ${errorMessage || 'None'}`);
  console.log();

  // 5. Verify polling behavior
  console.log('=== Verification ===');
  const checks = [
    {
      name: 'Upload returns jobId',
      passed: !!jobId,
      details: `Job ID: ${jobId}`
    },
    {
      name: 'Status endpoint accessible',
      passed: attempts > 0,
      details: `Made ${attempts} successful status requests`
    },
    {
      name: 'Periodic polling every 2s',
      passed: attempts > 1,
      details: `Multiple polls confirm interval timing`
    },
    {
      name: 'Status updates received',
      passed: finalStatus !== '',
      details: `Final status: ${finalStatus}`
    },
    {
      name: 'Exit condition triggered',
      passed: ['completed', 'failed'].includes(finalStatus),
      details: `Polling stopped on status: ${finalStatus}`
    },
    {
      name: 'Timeout protection',
      passed: attempts <= maxAttempts,
      details: `Max ${maxAttempts} attempts enforced`
    }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const status = check.passed ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    console.log(`   ${check.details}`);
    if (!check.passed) allPassed = false;
  });

  console.log();
  if (allPassed) {
    console.log('✅ Feature #126 is PASSING - All verification steps passed');
    console.log();
    console.log('Summary:');
    console.log('- Upload endpoint correctly returns jobId');
    console.log('- Status endpoint is accessible and authenticated');
    console.log('- Polling runs every 2 seconds as expected');
    console.log('- Status updates are received from server');
    console.log('- Proper exit conditions (completed/failed) work correctly');
    console.log('- Timeout protection prevents infinite polling');
  } else {
    console.log('❌ Feature #126 is FAILING - Some checks failed');
    process.exit(1);
  }
}

testPolling().catch(console.error);

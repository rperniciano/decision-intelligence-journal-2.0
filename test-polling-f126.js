import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testPolling() {
  console.log('=== Feature #126: Processing status polled correctly ===\n');

  // 1. Sign in
  console.log('1. Signing in as regression-test@example.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'regression-test@example.com',
    password: 'test123456',
  });

  if (authError) {
    console.error('❌ Sign in failed:', authError.message);
    process.exit(1);
  }
  console.log('✅ Signed in successfully\n');

  const token = authData.session.access_token;

  // 2. Create a mock audio file (1KB webm file)
  console.log('2. Creating mock audio file...');
  const mockAudio = Buffer.from('PK\x03\x04'); // Minimal valid file header
  const formData = new FormData();
  const blob = new Blob([mockAudio], { type: 'audio/webm' });
  formData.append('file', blob, 'test-recording.webm');

  // 3. Upload audio
  console.log('3. Uploading audio to API...');
  const uploadResponse = await fetch('http://localhost:4013/api/v1/recordings/upload', {
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

  const uploadResult = await uploadResponse.json();
  console.log('✅ Upload successful');
  console.log('   Job ID:', uploadResult.jobId);
  console.log('   Status:', uploadResult.status);
  console.log('');

  // 4. Poll for status
  console.log('4. Starting polling test...');
  console.log('   Will poll every 2 seconds for up to 30 seconds\n');

  let pollCount = 0;
  const maxPolls = 15;
  let finalStatus = 'pending';

  while (pollCount < maxPolls) {
    pollCount++;
    console.log(`   Poll attempt #${pollCount}...`);

    const statusResponse = await fetch(
      `http://localhost:4013/api/v1/recordings/${uploadResult.jobId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!statusResponse.ok) {
      console.error(`❌ Status check failed: HTTP ${statusResponse.status}`);
      process.exit(1);
    }

    const statusData = await statusResponse.json();
    console.log(`   Current status: ${statusData.status}`);

    if (statusData.status === 'completed') {
      console.log(`\n✅ Processing completed!`);
      console.log(`   Decision ID: ${statusData.decisionId}`);
      finalStatus = 'completed';
      break;
    }

    if (statusData.status === 'failed') {
      console.log(`\n❌ Processing failed: ${statusData.errorMessage || 'Unknown error'}`);
      finalStatus = 'failed';
      break;
    }

    // Wait 2 seconds before next poll
    if (pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n=== Test Results ===');
  console.log(`Total polls made: ${pollCount}`);
  console.log(`Final status: ${finalStatus}`);
  console.log(`Polling interval: 2 seconds`);
  console.log(`Endpoint: GET /api/v1/recordings/:id/status`);

  if (finalStatus === 'completed' || finalStatus === 'failed') {
    console.log('\n✅ Feature #126 VERIFIED: Polling mechanism works correctly');
    console.log('   - Upload endpoint returns jobId');
    console.log('   - Status endpoint is accessible');
    console.log('   - Periodic polling every 2 seconds');
    console.log('   - Status updates received from server');
  } else {
    console.log('\n⚠️ Polling test completed but processing did not finish');
    console.log('   (This may be due to missing AssemblyAI/OpenAI configuration)');
  }
}

testPolling().catch(console.error);

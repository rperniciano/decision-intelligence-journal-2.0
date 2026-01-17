// Test script to verify audio upload endpoint
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAudioUpload() {
  try {
    // Login first to get access token
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'session65test@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('Login failed:', authError);
      return;
    }

    console.log('✅ Logged in successfully');
    const accessToken = authData.session.access_token;

    // Create a minimal WebM audio file (silent audio, 1 second)
    // This is a minimal valid WebM file with Opus audio codec
    const webmHeader = Buffer.from([
      0x1a, 0x45, 0xdf, 0xa3, // EBML header
      // Minimal WebM structure - just enough to be valid
      0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);

    // For testing, create a simple buffer that represents audio
    const mockAudioBuffer = Buffer.concat([
      webmHeader,
      Buffer.alloc(1024) // Add some data
    ]);

    // Create form data
    const formData = new FormData();
    formData.append('file', mockAudioBuffer, {
      filename: 'test-recording.webm',
      contentType: 'audio/webm'
    });

    console.log('📤 Uploading audio to /api/v1/recordings/upload...');

    // Upload to API
    const response = await fetch('http://localhost:3001/api/v1/recordings/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Upload successful!');
    console.log('Decision created:', result.decision?.id);
    console.log('Audio URL:', result.decision?.audio_url);

    if (result.decision?.audio_url) {
      console.log('\n✅ FEATURE #125 VERIFIED: Audio uploaded to storage and URL returned');
    } else {
      console.log('\n❌ WARNING: No audio URL in response');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAudioUpload();

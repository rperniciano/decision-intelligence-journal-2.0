import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorageBucket() {
  console.log('Setting up Supabase Storage bucket for audio recordings...\n');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }

  const bucketExists = buckets?.some(b => b.name === 'audio-recordings');

  if (bucketExists) {
    console.log('✅ Bucket "audio-recordings" already exists');
  } else {
    // Create bucket
    const { data, error } = await supabase.storage.createBucket('audio-recordings', {
      public: true, // Allow public access for audio playback
      fileSizeLimit: 10485760, // 10MB limit
      allowedMimeTypes: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'],
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      return;
    }

    console.log('✅ Created bucket "audio-recordings"');
  }

  console.log('\n✅ Storage setup complete!');
}

setupStorageBucket().catch(console.error);

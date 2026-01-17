import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc'
);

const userId = '94bd67cb-b094-4387-a9c8-26b0c65904cd';

async function createTimestampTestDecision() {
  const beforeCreation = new Date();
  console.log('Current time BEFORE creating decision:', beforeCreation.toISOString());

  const decision = {
    user_id: userId,
    title: `TIMESTAMP_TEST_${Date.now()}`,
    description: 'Decision created to verify timestamp accuracy',
    status: 'decided',
    detected_emotional_state: 'confident',
    category_id: 'ef3c7424-444c-497f-a642-4c93837f8e3f', // Business category
  };

  const { data, error } = await supabase
    .from('decisions')
    .insert([decision])
    .select();

  if (error) {
    console.error('Error creating decision:', error);
    return;
  }

  const afterCreation = new Date();
  console.log('Current time AFTER creating decision:', afterCreation.toISOString());
  console.log('\nDecision created:');
  console.log('- ID:', data[0].id);
  console.log('- Title:', data[0].title);
  console.log('- created_at:', data[0].created_at);
  console.log('\nTime difference (should be < 1 minute):');

  const createdAt = new Date(data[0].created_at);
  const diffMs = Math.abs(createdAt - beforeCreation);
  const diffSeconds = Math.floor(diffMs / 1000);
  console.log(`- ${diffSeconds} seconds from before creation`);

  if (diffSeconds < 60) {
    console.log('✅ Timestamp is accurate and real-time!');
  } else {
    console.log('❌ Timestamp seems off by more than 1 minute');
  }
}

createTimestampTestDecision();

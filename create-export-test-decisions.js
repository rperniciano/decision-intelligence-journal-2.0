import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://doqojfsldvajmlscpwhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc'
);

const userId = '94bd67cb-b094-4387-a9c8-26b0c65904cd';
const timestamp = Date.now();

async function createExportTestDecisions() {
  const decisions = [
    {
      user_id: userId,
      title: `EXPORT_TEST_UNIQUE_${timestamp}_ALPHA`,
      description: 'This is a unique test decision for export verification ALPHA',
      status: 'decided',
      detected_emotional_state: 'confident',
      category_id: 'ef3c7424-444c-497f-a642-4c93837f8e3f', // Business category
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: `EXPORT_TEST_UNIQUE_${timestamp}_BETA`,
      description: 'This is a unique test decision for export verification BETA',
      status: 'decided',
      detected_emotional_state: 'anxious',
      category_id: 'ab4c15fd-c18f-4dbf-8217-ce3a97876726', // Health category
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      user_id: userId,
      title: `EXPORT_TEST_UNIQUE_${timestamp}_GAMMA`,
      description: 'This is a unique test decision for export verification GAMMA',
      status: 'decided',
      detected_emotional_state: 'excited',
      category_id: 'ce5aab7d-7d55-48a2-86ed-69a5e57e5dc5', // Relationships category
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert([decision])
      .select();

    if (error) {
      console.error('Error creating decision:', error);
    } else {
      console.log('Created decision:', data[0].title, 'ID:', data[0].id);
    }
  }

  console.log('\nAll 3 export test decisions created successfully!');
  console.log(`Unique identifier: ${timestamp}`);
}

createExportTestDecisions();

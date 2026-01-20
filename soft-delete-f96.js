import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://doqojfsldvajmlscpwhu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function softDeleteDecision() {
  const decisionId = '40193cca-b13b-4a2b-a5fb-34f99bd5fd83';

  console.log('Soft deleting decision:', decisionId);

  const { data, error } = await supabase
    .from('decisions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', decisionId)
    .select()
    .single();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('✓ Decision soft deleted:', data.title);
  }
}

softDeleteDecision();

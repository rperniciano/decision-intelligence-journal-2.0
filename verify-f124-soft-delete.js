// Verify soft delete behavior for Feature #124
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseKey);

const userId = '4aafaeb8-c81b-471c-a7bd-fcae33fbff3e';

async function verifySoftDelete() {
  console.log('Verifying soft delete behavior for Feature #124...\n');

  // Check all decisions (including deleted)
  const { data: allDecisions } = await supabase
    .from('decisions')
    .select('id, title, deleted_at')
    .eq('user_id', userId);

  console.log('All decisions in database (including soft-deleted):', allDecisions?.length || 0);

  // Check active decisions only (excluding deleted)
  const { data: activeDecisions } = await supabase
    .from('decisions')
    .select('id, title, deleted_at')
    .eq('user_id', userId)
    .is('deleted_at', null);

  console.log('Active decisions (excluding soft-deleted):', activeDecisions?.length || 0);

  if (allDecisions?.length === 1 && activeDecisions?.length === 0) {
    console.log('\n✅ Soft delete working correctly!');
    console.log('- Decision exists in database with deleted_at timestamp');
    console.log('- Decision is filtered out from active queries');
    console.log('- This matches the expected soft delete behavior (Feature #170)');
  }
}

verifySoftDelete();

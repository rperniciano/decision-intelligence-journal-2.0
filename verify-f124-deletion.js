// Verify decision was deleted for Feature #124
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDeletion() {
  const decisionId = 'a951b16c-881c-4955-84ee-0ae225d7d46e';

  console.log('Verifying deletion for decision:', decisionId);

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decisionId);

  if (error) {
    console.log('Error checking decision:', error.message);
  } else if (data && data.length > 0) {
    console.log('WARNING: Decision still exists in database!');
    console.log('Decision:', data[0]);
  } else {
    console.log('✅ Decision successfully deleted from database');
  }
}

verifyDeletion();

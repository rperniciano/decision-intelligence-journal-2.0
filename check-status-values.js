const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatuses() {
  const { data, error } = await supabase
    .from('decisions')
    .select('status')
    .limit(20);

  if (error) {
    console.error('Error:', error);
  } else {
    const statuses = [...new Set(data.map(d => d.status))];
    console.log('Status values found in database:');
    statuses.forEach(s => console.log('  -', s));
  }
}
checkStatuses();

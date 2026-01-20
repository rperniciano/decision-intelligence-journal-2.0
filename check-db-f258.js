const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, status, follow_up_date, created_at')
    .ilike('title', '%F258');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Database records:');
    data.forEach(d => {
      console.log(`- ${d.title}`);
      console.log(`  Status: ${d.status}`);
      console.log(`  follow_up_date: ${d.follow_up_date}`);
      console.log(`  created_at: ${d.created_at}`);
      console.log();
    });
  }
}

checkDatabase();

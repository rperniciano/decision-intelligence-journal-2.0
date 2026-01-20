const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDecisionData() {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, status, follow_up_date')
    .eq('title', 'OVERDUE_DECISION_F258');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found', data.length, 'OVERDUE_DECISION_F258 records:');
    data.forEach(d => {
      console.log('\n  ID:', d.id);
      console.log('  Status:', d.status);
      console.log('  Follow-up date:', d.follow_up_date);
      console.log('  Should be overdue:', d.status !== 'decided' && d.status !== 'abandoned' && d.follow_up_date);
    });
  }
}
checkDecisionData();

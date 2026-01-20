const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://doqojfsldvajmlscpwhu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY3NjYsImV4cCI6MjA4MzU0Mjc2Nn0.VFarYQFKWcHYGQcMFW9F5VXw1uudq1MQb65jS0AxCGc');

async function check() {
  console.log('Checking decision outcome data...\n');

  const { data, error } = await supabase
    .from('decisions')
    .select('outcome, outcome_notes, outcome_satisfaction, outcome_recorded_at')
    .eq('id', '7960c367-9ff0-48ac-b898-46bf669895d4')
    .single();

  if (error) {
    console.log('Error:', error.message);
    console.log('Details:', error);
  } else {
    console.log('Outcome data from decisions table:');
    console.log(JSON.stringify(data, null, 2));
  }

  // Also check if outcomes table exists
  console.log('\nChecking if outcomes table exists...');
  const { data: outcomesData, error: outcomesError } = await supabase
    .from('outcomes')
    .select('*')
    .eq('decision_id', '7960c367-9ff0-48ac-b898-46bf669895d4');

  if (outcomesError) {
    console.log('Outcomes table error:', outcomesError.message);
    console.log('Code:', outcomesError.code);
  } else {
    console.log('Outcomes from outcomes table:');
    console.log(JSON.stringify(outcomesData, null, 2));
  }
}

check().catch(console.error);

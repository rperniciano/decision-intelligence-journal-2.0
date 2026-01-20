const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  // Query information_schema to check if follow_up_date exists
  const { data, error } = await supabase
    .rpc('get_table_columns', { table_name: 'decisions' });

  if (error) {
    console.error('Error checking schema:', error);

    // Alternative: Try to select just one decision and see what columns we get
    const { data: testData, error: testError } = await supabase
      .from('decisions')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('Error querying decisions:', testError);
    } else if (testData && testData.length > 0) {
      console.log('Columns in decisions table:');
      console.log(Object.keys(testData[0]));
    }
  } else {
    console.log('Table columns:', data);
  }
}

checkSchema();

// Execute SQL migration via Supabase REST API
const https = require('https');

const supabaseUrl = 'doqojfsldvajmlscpwhu.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

// SQL to add outcome_satisfaction column
const sql = `ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS outcome_satisfaction SMALLINT CHECK (outcome_satisfaction >= 1 AND outcome_satisfaction <= 5);`;

const options = {
  hostname: supabaseUrl,
  port: 443,
  path: '/rest/v1/rpc/exec_sql', // This might not be the right endpoint
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`
  }
};

console.log('Attempting to execute SQL migration...');
console.log('SQL:', sql);
console.log('\nNote: Direct SQL execution via REST API may not be available.');
console.log('Please execute this SQL manually in Supabase dashboard:');
console.log('https://supabase.com/dashboard/project/doqojfsldvajmlscpwhu/sql');
console.log('\nSQL:', sql);

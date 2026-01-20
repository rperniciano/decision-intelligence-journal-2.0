const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials from .env
const SUPABASE_URL = 'https://doqojfsldvajmlscpwhu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getFeature96() {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('id', 96)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

getFeature96();

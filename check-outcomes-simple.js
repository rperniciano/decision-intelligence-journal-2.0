import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
  console.log('Checking if outcomes table exists...');

  try {
    const { data, error, status } = await supabase
      .from('outcomes')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Table does not exist or not accessible:');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Status:', status);
      process.exit(1);
    } else {
      console.log('✅ Outcomes table exists!');
      console.log('Sample data:', data);
      process.exit(0);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
}

checkTable();

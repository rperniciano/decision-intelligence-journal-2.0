import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatusEnum() {
  // Try each possible status value
  const statuses = ['draft', 'deliberating', 'decided', 'abandoned', 'reviewed', 'in_progress'];

  for (const status of statuses) {
    const { error } = await supabase
      .from('decisions')
      .select('id')
      .eq('status', status)
      .limit(1);

    if (!error || error.code !== '22P02') {
      console.log(`✅ "${status}" is a valid status value`);
    } else {
      console.log(`❌ "${status}" is NOT valid`);
    }
  }
}

checkStatusEnum();

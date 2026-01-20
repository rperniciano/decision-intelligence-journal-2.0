import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Checking decision_status enum values...');

  // Try to query with each status to see which ones are valid
  const statuses = ['draft', 'deliberating', 'decided', 'abandoned', 'reviewed'];

  for (const status of statuses) {
    const { data, error } = await supabase
      .from('decisions')
      .select('status')
      .eq('status', status)
      .limit(1);

    if (error && error.message.includes('invalid input value for enum')) {
      console.log(`✗ "${status}" is NOT a valid enum value`);
    } else if (error) {
      console.log(`? "${status}" - Error: ${error.message}`);
    } else {
      console.log(`✓ "${status}" is a valid enum value`);
    }
  }
}

main().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Checking if outcomes table exists...');

  const { data, error } = await supabase
    .from('outcomes')
    .select('*')
    .limit(1);

  if (error) {
    console.log('✗ Outcomes table does not exist:', error.code);
    console.log('  Error message:', error.message);
  } else {
    console.log('✓ Outcomes table exists!');
  }
}

main().catch(console.error);

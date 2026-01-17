import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('decisions').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Decision fields:', Object.keys(data[0]).join(', '));
    console.log('\nSample decision:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}
checkSchema();

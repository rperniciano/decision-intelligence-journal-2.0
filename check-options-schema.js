import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  try {
    // Try to get one option to see the schema
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Options schema (from sample data):');
      if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('\nSample record:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('No options found in database');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();

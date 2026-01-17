import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  try {
    // Try to get one pros_cons record to see the schema
    const { data, error } = await supabase
      .from('pros_cons')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error.message);
      console.log('\nTable may not exist');
    } else {
      console.log('Pros/Cons table exists!');
      if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('\nSample record:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('Table exists but is empty');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('Checking categories table schema...\n');

  // Get a sample category to see its fields
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Sample category fields:');
    console.log(Object.keys(data[0]));
    console.log('\nSample data:');
    console.log(data[0]);
  } else {
    console.log('No categories found in database');
  }
}

checkSchema();

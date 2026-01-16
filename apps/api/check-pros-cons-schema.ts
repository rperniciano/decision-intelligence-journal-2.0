// Check pros_cons table schema
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('pros_cons')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Pros/cons table columns:', Object.keys(data[0]));
    } else {
      console.log('No data found. Trying insert...');
      const { data: insertData, error: insertError } = await supabase
        .from('pros_cons')
        .insert({
          option_id: 'a088d44f-888d-46d9-ab45-3b8faa2f3577',
          type: 'pro',
          content: 'Test content'
        })
        .select();

      if (insertError) {
        console.log('Insert error:', insertError);
      } else {
        console.log('Insert succeeded! Columns:', Object.keys(insertData[0]));
      }
    }
  }
}

main();

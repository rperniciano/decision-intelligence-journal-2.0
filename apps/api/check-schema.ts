// Check the actual database schema
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Try to get any existing decision
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Query succeeded. Data:', data);
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('No decisions found. Trying to insert minimal data...');

      const { data: insertData, error: insertError } = await supabase
        .from('decisions')
        .insert({
          user_id: '1bcace3d-315a-4c2f-8751-e950fb21ff14',
          title: 'Test'
        })
        .select()
        .single();

      if (insertError) {
        console.log('Insert error:', insertError);
      } else {
        console.log('Insert succeeded! Columns:', Object.keys(insertData));
      }
    }
  }
}

main();

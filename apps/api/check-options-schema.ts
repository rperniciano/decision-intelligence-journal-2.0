// Check options table schema
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
    .from('options')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Options table columns:', data && data.length > 0 ? Object.keys(data[0]) : 'empty table - cannot determine schema');

    // Try inserting to see what's required
    const { error: insertError } = await supabase
      .from('options')
      .insert({
        decision_id: '442c4979-4c47-44d0-8548-8e3010de0de4',
        title: 'Test Option'
      })
      .select();

    if (insertError) {
      console.log('Insert error:', insertError);
    } else {
      console.log('Insert succeeded!');
    }
  }
}

main();

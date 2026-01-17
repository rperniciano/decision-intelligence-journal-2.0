import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  // Try to get any decision to see the structure
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No decisions found. Trying to insert minimal decision...');

    // Try minimal insert
    const { data: newData, error: insertError } = await supabase
      .from('decisions')
      .insert({
        user_id: 'ea1654e3-2b8b-47f3-8619-77e70c2f17ca',
        title: 'Test'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Success! Columns:', Object.keys(newData));
    }
  }
}

checkColumns();

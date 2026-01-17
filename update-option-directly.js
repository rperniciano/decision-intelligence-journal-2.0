import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateOption() {
  const optionId = 'f0c0a1bd-b6f9-4c5e-93f0-56954696d658';

  const { data, error } = await supabase
    .from('options')
    .update({
      title: 'Renamed Alpha - Session 32 Test'
    })
    .eq('id', optionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Option updated successfully:');
    console.log('  ID:', data.id);
    console.log('  New Title:', data.title);
  }
}

updateOption();

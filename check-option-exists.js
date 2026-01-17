import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOption() {
  const optionId = 'f0c0a1bd-b6f9-4c5e-93f0-56954696d658';

  const { data, error } = await supabase
    .from('options')
    .select('*')
    .eq('id', optionId)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Option found:');
    console.log('  ID:', data.id);
    console.log('  Title:', data.title);
    console.log('  Decision ID:', data.decision_id);
    console.log('  Description:', data.description);
  }
}

checkOption();

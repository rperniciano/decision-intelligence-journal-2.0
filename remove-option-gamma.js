import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeOption() {
  const optionId = '982d03d9-ec68-4929-a188-348550a4a215'; // Option Gamma

  const { error } = await supabase
    .from('options')
    .delete()
    .eq('id', optionId);

  if (error) {
    console.error('Error removing option:', error);
  } else {
    console.log('Option Gamma removed successfully');
  }
}

removeOption();

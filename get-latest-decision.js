import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Latest decision:');
    console.log('  ID:', data[0].id);
    console.log('  Title:', data[0].title);
    console.log('  Created:', data[0].created_at);
    console.log('  Review URL:', 'http://localhost:5173/decisions/' + data[0].id + '/review');
  } else {
    console.log('No decisions found');
  }
})();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateStatus() {
  const decisionId = 'e6c199c3-4abb-4569-8042-858dbf9c8c4d';

  const { data, error } = await supabase
    .from('decisions')
    .update({
      status: 'deliberating',
      updated_at: new Date().toISOString()
    })
    .eq('id', decisionId)
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Decision status updated successfully!');
    console.log('Decision ID:', data.id);
    console.log('Title:', data.title);
    console.log('New Status:', data.status);
  }
}

updateStatus();

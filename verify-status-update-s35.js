import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyStatus() {
  const decisionId = 'e6c199c3-4abb-4569-8042-858dbf9c8c4d';

  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, status')
    .eq('id', decisionId)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Decision status verified in database');
    console.log('Decision ID:', data.id);
    console.log('Title:', data.title);
    console.log('Status:', data.status);

    if (data.status === 'in_progress') {
      console.log('\n✅ SUCCESS: Status is "in_progress" as expected!');
    } else {
      console.log('\n❌ FAIL: Status is not "in_progress"');
    }
  }
}

verifyStatus();

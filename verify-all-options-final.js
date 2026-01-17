import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyOptions() {
  const decisionId = 'cc05273e-1d33-4c75-8916-336fac8c24de';

  const { data, error } = await supabase
    .from('options')
    .select('*')
    .eq('decision_id', decisionId)
    .order('created_at');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`\nTotal options for decision: ${data.length}\n`);
    data.forEach((option, index) => {
      console.log(`Option ${index + 1}:`);
      console.log(`  ID: ${option.id}`);
      console.log(`  Title: ${option.title}`);
      console.log(`  Description: ${option.description}`);
      console.log('');
    });
  }
}

verifyOptions();

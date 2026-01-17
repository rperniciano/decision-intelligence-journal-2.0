import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addOption() {
  const decisionId = 'cc05273e-1d33-4c75-8916-336fac8c24de';

  const { data, error } = await supabase
    .from('options')
    .insert({
      decision_id: decisionId,
      title: 'Option Delta - Added Session 32',
      description: 'Fourth option added during testing'
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding option:', error);
  } else {
    console.log('Option added successfully:');
    console.log('  ID:', data.id);
    console.log('  Title:', data.title);
  }
}

addOption();

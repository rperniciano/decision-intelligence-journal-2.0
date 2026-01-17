import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecision() {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('id, title, deleted_at, user_id')
      .eq('id', '8a905612-4251-4b15-8cbd-dc99b4b63cdd')
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Decision:', data);
    console.log('deleted_at:', data.deleted_at);
    console.log('Is deleted?', data.deleted_at !== null);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDecision();

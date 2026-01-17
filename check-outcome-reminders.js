import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('outcome_reminders')
  .select('*')
  .limit(1);

if (error) {
  console.log('outcome_reminders table does NOT exist');
  console.log('Error:', error.message);
} else {
  console.log('✅ outcome_reminders table exists');
  console.log('Sample data:', data);
}

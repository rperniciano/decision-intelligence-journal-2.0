import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  // Delete outcomes for the test decisions
  const { error: outcomeError } = await supabase
    .from('outcomes')
    .delete()
    .in('decision_id', [
      '10d585cc-d580-4a6c-ad60-828113076c14', // DECISION_A
      '07965e29-7d71-443d-85d8-3c4bdee89782'  // DECISION_B
    ]);

  if (outcomeError) {
    console.log('Error deleting outcomes:', outcomeError.message);
  } else {
    console.log('Deleted outcomes');
  }

  // Delete the test decisions
  const { error: decisionError } = await supabase
    .from('decisions')
    .delete()
    .in('id', [
      '10d585cc-d580-4a6c-ad60-828113076c14', // DECISION_A
      '07965e29-7d71-443d-85d8-3c4bdee89782'  // DECISION_B
    ]);

  if (decisionError) {
    console.log('Error deleting decisions:', decisionError.message);
  } else {
    console.log('Deleted test decisions');
  }

  // Delete the test user
  const { error: userError } = await supabase.auth.admin.deleteUser(
    '4147a226-047d-45e7-b7f2-32fafa81a291'
  );

  if (userError) {
    console.log('Error deleting user:', userError.message);
  } else {
    console.log('Deleted test user');
  }

  console.log('Cleanup complete!');
}

cleanup();

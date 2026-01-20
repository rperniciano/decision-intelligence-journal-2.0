import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDecision() {
  const decisionId = '09119928-c634-47c0-a672-2f27bce43e3d';

  // Check if decision exists at all
  const { data: decision, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decisionId);

  if (error) {
    console.log('Error checking decision:', error.message);
  } else if (decision && decision.length > 0) {
    console.log('Decision found:');
    console.log('  ID:', decision[0].id);
    console.log('  Title:', decision[0].title);
    console.log('  Deleted at:', decision[0].deleted_at);
    console.log('  Status:', decision[0].status);
    console.log('  All data:', JSON.stringify(decision[0], null, 2));
  } else {
    console.log('Decision NOT found in database - it was permanently deleted!');
    console.log('This is a BUG - soft delete is not working!');
  }
}

checkDecision();

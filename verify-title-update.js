import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyTitle() {
  const decisionId = '6c783d38-06aa-462c-bbfe-4e6fbfcc40be';

  const { data, error } = await supabase
    .from('decisions')
    .select('id, title')
    .eq('id', decisionId)
    .single();

  if (error) {
    console.error('Error fetching decision:', error);
    return;
  }

  console.log('Decision ID:', data.id);
  console.log('Title in database:', data.title);
  console.log('Expected:', 'Updated Title - Session 30 Verification');
  console.log('Match:', data.title === 'Updated Title - Session 30 Verification' ? '✅' : '❌');
}

verifyTitle();

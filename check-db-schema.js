// Check what's in the database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function main() {
  // Login as test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testdev@example.com',
    password: 'testpass123',
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  console.log('✓ Logged in as', authData.user.email);

  // Try to select from decisions table
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
  }
}

main().catch(console.error);

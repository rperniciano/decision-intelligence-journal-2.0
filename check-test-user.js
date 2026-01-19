import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'test@example.com')
    .single();

  if (error) {
    console.log('User not found:', error.message);
    // Try to find any user
    const { data: allUsers } = await supabase
      .from('users')
      .select('email, id')
      .limit(5);
    console.log('Existing users:', allUsers);
  } else {
    console.log('Found user:', data);
  }
}

checkUser();

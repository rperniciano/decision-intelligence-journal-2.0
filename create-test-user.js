import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  // Create user with auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'test61@example.com',
    password: 'password123',
    email_confirm: true
  });

  if (authError) {
    console.log('Auth error:', authError.message);
    return;
  }

  console.log('Created user:', authData.user.id, authData.user.email);
}

createUser();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'session32test@example.com',
    password: 'testpassword123',
    email_confirm: true
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  console.log('User created:', authData.user.id);
  console.log('Email:', authData.user.email);
}

createUser();

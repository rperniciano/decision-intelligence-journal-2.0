import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const email = 'session35test@example.com';
  const password = 'password123';

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('User created:', data.user.id);
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

createTestUser();

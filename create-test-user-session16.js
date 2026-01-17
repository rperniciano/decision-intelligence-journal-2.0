import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  const email = 'session16test@example.com';
  const password = 'Session16Test!';

  console.log('Creating test user:', email);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('User created successfully!');
    console.log('ID:', data.user.id);
    console.log('Email:', data.user.email);
  }
}

createUser();

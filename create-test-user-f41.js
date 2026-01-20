import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  const email = 'f41-cancel-test@example.com';
  const password = 'Test123456';

  // Create user with email confirmation bypass
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'F41 Cancel Test'
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return;
  }

  console.log('User created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', data.user.id);
}

createTestUser();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTestUser() {
  const email = 'test-f181@example.com';
  const password = 'test123456';

  // Create user with email confirmation disabled
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Test User F181' }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    // User might already exist, try to get existing user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      console.log('User ID:', existingUser.id);
    }
  } else {
    console.log('User created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', data.user.id);
  }
}

createTestUser();

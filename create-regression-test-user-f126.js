import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const email = 'regression-test@example.com';
  const password = 'test123456';

  console.log('Creating test user:', email);

  // Create user with auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    // User might already exist, try to get existing user
    console.log('User might already exist, checking...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      console.log('Found existing user:', existingUser.id);
      console.log('User email confirmed:', existingUser.email_confirmed_at);

      // Update password to be sure
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
      });
      console.log('Password updated to:', password);
    } else {
      console.error('Error creating user:', authError);
      process.exit(1);
    }
  } else {
    console.log('✅ User created successfully!');
    console.log('User ID:', authData.user.id);
    console.log('Email confirmed:', authData.user.email_confirmed_at);
  }
}

createTestUser();

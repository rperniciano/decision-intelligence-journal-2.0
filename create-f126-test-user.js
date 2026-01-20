import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createUser() {
  const email = 'test-f126@example.com';
  const password = 'test123456';

  console.log('Creating test user:', email);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error('Error creating user:', authError.message);
    // Try updating existing user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      console.log('Updating existing user password...');
      await supabase.auth.admin.updateUserById(existingUser.id, { password });
      console.log('✅ Password updated for existing user');
      console.log('Email:', email);
      console.log('Password:', password);
    }
    return;
  }

  console.log('✅ User created successfully!');
  console.log('User ID:', authData.user.id);
  console.log('Email confirmed:', authData.user.email_confirmed_at);
  console.log('Email:', email);
  console.log('Password:', password);
}

createUser();

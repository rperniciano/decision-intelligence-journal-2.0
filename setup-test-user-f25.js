import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTestUser() {
  const testEmail = 'testuserF25@example.com';
  const testPassword = 'password123';

  // Check if user exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const existingUser = users.find(u => u.email === testEmail);

  if (existingUser) {
    console.log('User already exists:', testEmail);
    console.log('User ID:', existingUser.id);

    // Update email confirmation to bypass
    await supabase.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      user_metadata: { name: 'Test User F25' }
    });
    console.log('Email confirmed for user');
  } else {
    console.log('Creating new user:', testEmail);
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Test User F25'
      }
    });

    if (error) {
      console.error('Error creating user:', error.message);
      return;
    }

    console.log('User created successfully!');
    console.log('User ID:', data.user.id);
  }

  console.log('\nCredentials:');
  console.log('  Email:', testEmail);
  console.log('  Password:', testPassword);
  console.log('\nYou can now log in at: http://localhost:5173/login');
}

setupTestUser();

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

async function createTestUser() {
  const testEmail = 'testuserF25@example.com';
  const testPassword = 'password123';

  console.log('Creating test user for Feature #25...');

  // Try to create user with admin API (bypasses email confirmation)
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      name: 'Test User F25'
    }
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('User already exists, trying to get user ID...');

      // List users to find the ID
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users.find(u => u.email === testEmail);

      if (user) {
        console.log('✓ Found existing user');
        console.log('User ID:', user.id);
        console.log('Email:', user.email);

        // Confirm email
        await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });
        console.log('✓ Email confirmed');
      } else {
        console.error('User not found in list!');
      }
    } else {
      console.error('Error creating user:', error.message);
      throw error;
    }
  } else {
    console.log('✓ Successfully created test user');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Email confirmed:', data.user.email_confirmed_at);
  }

  console.log('\nCredentials:');
  console.log('  Email:', testEmail);
  console.log('  Password:', testPassword);
  console.log('\nYou can now log in at: http://localhost:5173/login');
}

createTestUser()
  .then(() => {
    console.log('\n✓ Test user setup complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n✗ Failed to create test user');
    process.exit(1);
  });

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
  const email = 'testf172@example.com';

  // List users to find existing user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (user) {
    // Update user to confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (error) {
      console.log('Error confirming user:', error.message);
    } else {
      console.log('User email confirmed successfully:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
    }
  } else {
    console.log('User not found, creating...');
    const password = 'testpass123';
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Test User F172'
      }
    });

    if (error) {
      console.log('Error creating user:', error.message);
    } else {
      console.log('User created successfully:');
      console.log('  ID:', data.user.id);
      console.log('  Email:', data.user.email);
    }
  }
}

createTestUser();

// Quick script to confirm user email using Supabase Admin API
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUser(email) {
  try {
    // Get user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.log(`User not found: ${email}`);
      return;
    }

    console.log(`Found user: ${user.id}, email_confirmed: ${user.email_confirmed_at ? 'YES' : 'NO'}`);

    if (!user.email_confirmed_at) {
      // Update user to confirm email
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (error) {
        console.error('Error confirming user:', error);
        return;
      }

      console.log('✅ User email confirmed successfully!');
    } else {
      console.log('✅ User email already confirmed');
    }

    console.log('\nYou can now log in with:');
    console.log(`Email: ${email}`);
    console.log(`Password: password123`);

  } catch (error) {
    console.error('Error:', error);
  }
}

const email = 'session65test@example.com';
confirmUser(email);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key can bypass RLS
);

async function confirmUser(email) {
  try {
    // Get user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.error(`User ${email} not found`);
      return;
    }

    console.log('User found:', user.id, user.email);
    console.log('Email confirmed:', user.email_confirmed_at ? 'YES' : 'NO');

    if (!user.email_confirmed_at) {
      // Update user to confirm email
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (error) {
        console.error('Error confirming email:', error);
      } else {
        console.log('✅ Email confirmed for:', email);
      }
    } else {
      console.log('✅ Email already confirmed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

const email = process.argv[2] || 'session22test@example.com';
confirmUser(email);

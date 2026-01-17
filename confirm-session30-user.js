import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUser() {
  console.log('Looking for user: session30test@example.com');

  // Get user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === 'session30test@example.com');

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:', user.id);
  console.log('Email confirmed:', user.email_confirmed_at);

  // Update user to confirm email
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true
  });

  if (error) {
    console.error('Error confirming user:', error);
    return;
  }

  console.log('✅ User confirmed successfully');
  console.log('User ID:', data.user.id);
  console.log('Email confirmed at:', data.user.email_confirmed_at);
}

confirmUser();

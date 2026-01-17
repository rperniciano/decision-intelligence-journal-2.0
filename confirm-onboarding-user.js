// Manually confirm the onboarding test user
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmUser() {
  const email = 'onboarding.session47@example.com';

  // Get the user
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('User not found:', email);
    return;
  }

  console.log('User found:', {
    id: user.id,
    email: user.email,
    confirmed_at: user.confirmed_at,
    email_confirmed_at: user.email_confirmed_at
  });

  // Update user to confirm email
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      email_confirm: true
    }
  );

  if (error) {
    console.error('Error confirming user:', error);
    return;
  }

  console.log('✅ User email confirmed!', {
    id: data.user.id,
    email: data.user.email,
    email_confirmed_at: data.user.email_confirmed_at
  });
}

confirmUser().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUser() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existingUser = users.find(u => u.email === 'regression-test@example.com');
  if (existingUser) {
    console.log('User ID:', existingUser.id);
    console.log('Email confirmed:', existingUser.email_confirmed_at);
    await supabase.auth.admin.updateUserById(existingUser.id, { password: 'test123456' });
    console.log('Password updated to: test123456');
  } else {
    console.log('User not found');
  }
}
checkUser();

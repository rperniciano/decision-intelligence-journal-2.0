import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data: { users } } = await supabase.auth.admin.listUsers();
const user = users.find(u => u.email === 'testuserF25@example.com');

if (user) {
  console.log('Found user:', user.email, user.id);
  await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
  console.log('Email confirmed');
} else {
  console.log('User not found');
}

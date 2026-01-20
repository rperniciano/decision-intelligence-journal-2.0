import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  const email = 'f110-loading-test@example.com';
  const password = 'TestPassword123!';

  // Delete if exists
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id);
    console.log('Deleted existing user');
  }

  // Create user with auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    console.log('Auth error:', authError.message);
    return;
  }

  console.log('Created user:', authData.user.id, authData.user.email);
  console.log('Password:', password);
}

createUser();

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

async function confirmUser() {
  const targetEmail = 'session173740@example.com';

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  console.log('Total users:', users.length);
  users.forEach(u => console.log('  -', u.email));

  const user = users.find(u => u.email === targetEmail);

  if (user) {
    console.log('\n✓ Found user:', targetEmail);
    console.log('  User ID:', user.id);
    console.log('  Email confirmed:', user.email_confirmed_at);

    await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });
    console.log('✓ Email confirmed successfully');
  } else {
    console.log('\n✗ User not found:', targetEmail);
  }
}

confirmUser();

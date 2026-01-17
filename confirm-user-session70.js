const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function confirmUser() {
  const email = 'session70test@example.com';

  const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    return;
  }

  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error('User not found');
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true
  });

  if (error) {
    console.error('Error confirming user:', error);
  } else {
    console.log('User confirmed successfully!');
  }
}

confirmUser();

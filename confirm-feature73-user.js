const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmUser() {
  const email = 'feature73test@example.com';

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error('User not found');
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirmed_at: new Date().toISOString()
  });

  if (error) {
    console.error('Error confirming user:', error);
  } else {
    console.log('User confirmed successfully!');
  }
}

confirmUser();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function confirmEmail() {
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  const user = users.users.find(u => u.email === 'test204@example.com');

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Found user:', user.id);

  const { data, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true
  });

  if (updateError) {
    console.log('Error confirming email:', updateError.message);
  } else {
    console.log('Email confirmed successfully for test204@example.com');
  }
}

confirmEmail();

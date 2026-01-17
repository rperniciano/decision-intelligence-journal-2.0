const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  const email = 'session24test@example.com';
  const password = 'testpass123';

  // Create user with auto-confirm
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error);
    return;
  }

  console.log('User created successfully:', {
    id: data.user.id,
    email: data.user.email,
    confirmed: data.user.email_confirmed_at !== null
  });
}

createUser();

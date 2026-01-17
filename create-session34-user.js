const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'session34test@example.com',
    password: 'TestPassword123!',
    email_confirm: true,
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
  }
}

createTestUser();

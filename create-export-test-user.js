const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTestUser() {
  const email = 'export-test-' + Date.now() + '@example.com';
  const password = 'TestPassword123!';

  console.log('Creating test user:', email);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('✅ User created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', data.user.id);
  }
}

createTestUser();

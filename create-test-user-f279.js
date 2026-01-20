const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function createTestUser() {
  const email = `f279-test-${Date.now()}@example.com`;
  const password = 'Test123456!';

  console.log('Creating test user:', email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return;
  }

  console.log('✅ User created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);

  if (data.user) {
    console.log('User ID:', data.user.id);
  }
}

createTestUser();

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const email = 'f87-test@example.com';
  const password = 'Test1234!';

  // Create user with admin privileges (bypasses email confirmation)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'F87 Test User'
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    // Try to get existing user instead
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      return existingUser.id;
    }
    process.exit(1);
  }

  console.log('✅ Test user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', data.user.id);
  return data.user.id;
}

createTestUser().then(console.log).catch(console.error);

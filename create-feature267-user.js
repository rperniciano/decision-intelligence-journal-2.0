const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const email = 'feature267@test.com';
  const password = 'test123456';

  console.log('Creating test user for Feature #267...');

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log('User already exists:', existingUser.id);
    return existingUser;
  }

  // Create user with auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    throw authError;
  }

  console.log('Test user created:', authData.user.id);
  console.log('Email:', email);
  console.log('Password:', password);

  return authData.user;
}

createTestUser()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));

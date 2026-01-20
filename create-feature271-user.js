/**
 * Create test user for Feature #271
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const email = 'feature271@test.com';
  const password = 'Test123456';

  console.log('Creating test user for Feature #271...');
  console.log('Email:', email);

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log('User already exists:', existingUser.id);
    return;
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }

  console.log('Created auth user:', authData.user.id);
  console.log('Password:', password);
}

createTestUser().catch(console.error);

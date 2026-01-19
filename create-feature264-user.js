const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  const email = 'feature264test@example.com';
  const password = 'Test123456!';
  const name = 'Feature 264 Test User';

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log('User already exists:', existingUser.id);
    return;
  }

  // Create user with auth.admin
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (createError) {
    console.error('Error creating user:', createError);
    return;
  }

  console.log('Created user:', newUser.user.id);
  console.log('Email:', email);
  console.log('Password:', password);
}

createUser().catch(console.error);

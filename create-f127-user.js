const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findOrCreateUser() {
  // First try to find existing test user
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'f127-error-test@example.com')
    .single();

  if (existingUser) {
    console.log('Found existing user:', existingUser.email);
    console.log('User ID:', existingUser.id);
    return;
  }

  // Create new user
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email: 'f127-error-test@example.com',
      password_hash: 'dummy_hash_for_auth',
      full_name: 'F127 Error Test User'
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating user:', createError.message);
    process.exit(1);
  }

  console.log('Created user:', newUser.email);
  console.log('User ID:', newUser.id);
}

findOrCreateUser();

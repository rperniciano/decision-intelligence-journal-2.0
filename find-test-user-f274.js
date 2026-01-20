// Find or create test user for Feature #274
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function findOrCreateTestUser() {
  // Try to find existing test user
  const { data: existingUsers, error: findError } = await supabase
    .from('users')
    .select('*')
    .ilike('email', '%test%274%')
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    console.log('Found existing test user:', existingUsers[0].email);
    console.log('User ID:', existingUsers[0].id);
    return existingUsers[0];
  }

  // Create new test user
  const testEmail = `test_f274_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log('Creating new test user:', testEmail);

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return null;
  }

  console.log('✅ Test user created successfully');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('User ID:', authData.user.id);

  return authData.user;
}

findOrCreateTestUser()
  .then(user => {
    if (!user) {
      console.error('❌ Failed to get test user');
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

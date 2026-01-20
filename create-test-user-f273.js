const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  const email = 'test_f273@example.com';
  const password = 'test123456';

  try {
    // First try to delete the user if it exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      console.log('Deleting existing user...');
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('Existing user deleted');
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('Error creating user:', error);
      process.exit(1);
    }

    console.log('Test user created successfully:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', data.user.id);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createTestUser();

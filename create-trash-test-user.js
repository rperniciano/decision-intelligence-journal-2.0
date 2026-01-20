const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const email = 'trash-test@example.com';
  const password = 'Test123456';

  console.log('Creating test user for trash feature test...');

  // First delete if exists
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .eq('email', email);

  if (existingUsers && existingUsers.length > 0) {
    console.log('User exists, deleting...');
    await supabase.auth.admin.deleteUser(existingUsers[0].id);
  }

  // Create user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('✅ Test user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', data.user.id);
})();

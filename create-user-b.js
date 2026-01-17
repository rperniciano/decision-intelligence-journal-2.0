const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = 'userb_session23@example.com';
  const password = 'password123';

  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: 'User B Session 23'
    }
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  console.log('✅ Created User B:');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   ID:', authData.user.id);
  console.log('\nThis user should NOT see USER_A_PRIVATE_SESSION23');
}

main();

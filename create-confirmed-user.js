// Create and auto-confirm a test user for Feature #135 testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createConfirmedUser() {
  const email = `f135-test-${Date.now()}@example.com`;
  const password = 'password123';

  console.log('Creating confirmed test user...');
  console.log('Email:', email);

  // Create user with auto-confirm
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'F135 Test User'
    }
  });

  if (error) {
    console.error('❌ Error creating user:', error.message);
    return;
  }

  console.log('✅ User created successfully!');
  console.log('   User ID:', data.user.id);
  console.log('   Email:', data.user.email);
  console.log('   Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
  console.log('\nYou can now sign in with:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
}

createConfirmedUser().catch(console.error);

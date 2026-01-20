const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_EMAIL = `test-f203-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpass123';

async function main() {
  // Create test user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true
  });

  if (userError) {
    console.error('Error creating user:', userError);
    return;
  }

  console.log('Created test user:', TEST_EMAIL);
  console.log('Password:', TEST_PASSWORD);
  console.log('User ID:', userData.user.id);
}

main();

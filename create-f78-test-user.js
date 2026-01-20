/**
 * Create test user for Feature #78 UI testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  const timestamp = Date.now();
  const email = `f78-ui-test-${timestamp}@example.com`;
  const password = 'Test1234!';

  console.log(`Creating user: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'F78 Test User'
    }
  });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`✅ User created: ${data.user.id}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('\nUse these credentials to log in to the app.');
}

createUser();

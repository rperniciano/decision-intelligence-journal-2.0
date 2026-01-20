/**
 * Create a confirmed test user for Feature #75 regression testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTestUser() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const timestamp = Date.now();
  const testEmail = `f75-regression-${timestamp}@example.com`;
  const testPassword = 'Test1234!';
  const testName = 'Regression Test User 75';

  console.log('\n' + '='.repeat(70));
  console.log('Creating Test User for Feature #75 Regression Test');
  console.log('='.repeat(70));
  console.log(`\nEmail: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  console.log(`Name: ${testName}`);

  // Create user via Supabase Admin with auto-confirmation
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      name: testName
    }
  });

  if (userError) {
    console.log('\n❌ Failed to create user:', userError.message);
    process.exit(1);
  }

  const userId = userData.user.id;
  console.log(`\n✅ User created: ${userId}`);
  console.log(`\nCredentials for login:`);
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  console.log(`   Name: ${testName}`);
  console.log('\n' + '='.repeat(70));
}

createTestUser().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});

/**
 * Create test users for Feature #14 UI test
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEST_TIMESTAMP = Date.now();
const USER_A_EMAIL = `f14-ui-a-${TEST_TIMESTAMP}@example.com`;
const USER_B_EMAIL = `f14-ui-b-${TEST_TIMESTAMP}@example.com`;
const PASSWORD = 'TestPassword123!';

async function createUsers() {
  console.log('Creating test users for Feature #14 UI test...\n');

  // Create User A
  const { data: userA, error: errorA } = await supabase.auth.admin.createUser({
    email: USER_A_EMAIL,
    password: PASSWORD,
    email_confirm: true
  });

  if (errorA) {
    console.error('Error creating User A:', errorA);
  } else {
    console.log(`✅ Created User A: ${USER_A_EMAIL}`);
    console.log(`   ID: ${userA.user.id}`);
  }

  // Create User B
  const { data: userB, error: errorB } = await supabase.auth.admin.createUser({
    email: USER_B_EMAIL,
    password: PASSWORD,
    email_confirm: true
  });

  if (errorB) {
    console.error('Error creating User B:', errorB);
  } else {
    console.log(`✅ Created User B: ${USER_B_EMAIL}`);
    console.log(`   ID: ${userB.user.id}`);
  }

  console.log('\nCredentials saved for UI test:');
  console.log(JSON.stringify({
    timestamp: TEST_TIMESTAMP,
    userA: { email: USER_A_EMAIL, password: PASSWORD },
    userB: { email: USER_B_EMAIL, password: PASSWORD }
  }, null, 2));
}

createUsers().catch(console.error);

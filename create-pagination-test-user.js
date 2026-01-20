/**
 * Create a test user for pagination testing (Feature #131)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const TEST_EMAIL = 'pagination-test-131@example.com';
const TEST_PASSWORD = 'TestPassword123!';

async function createTestUser() {
  console.log('Creating test user for pagination testing...');

  // Check if user exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  const existingUser = users?.find(u => u.email === TEST_EMAIL);

  if (existingUser) {
    console.log('✓ Test user already exists:', TEST_EMAIL);
    console.log('  Password:', TEST_PASSWORD);
    console.log('  User ID:', existingUser.id);
    return existingUser.id;
  }

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return null;
  }

  console.log('✓ Test user created successfully!');
  console.log('  Email:', TEST_EMAIL);
  console.log('  Password:', TEST_PASSWORD);
  console.log('  User ID:', data.user.id);

  return data.user.id;
}

async function createManyDecisions(userId) {
  console.log('\nCreating 25 decisions for pagination testing via API...');

  // Get auth token
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError) {
    console.error('Sign in error:', signInError.message);
    return;
  }

  const token = signInData.session.access_token;

  let created = 0;
  for (let i = 1; i <= 25; i++) {
    const decision = {
      title: `Pagination Test Decision #${i}`,
      status: 'draft',
      category: 'Testing',
    };

    try {
      const response = await fetch('http://localhost:4001/api/v1/decisions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(decision),
      });

      if (response.ok) {
        created++;
        if (created % 5 === 0) {
          console.log(`  Created ${created} decisions...`);
        }
      } else {
        console.error(`Failed to create decision #${i}:`, response.status);
      }
    } catch (error) {
      console.error(`Error creating decision #${i}:`, error.message);
    }
  }

  console.log(`✓ Created ${created} decisions`);
  console.log('  This should provide enough data for pagination (20 per page)');
}

async function main() {
  const userId = await createTestUser();

  if (userId) {
    await createManyDecisions(userId);
    console.log('\n✅ Ready for pagination testing!');
    console.log('Login credentials:');
    console.log('  Email:', TEST_EMAIL);
    console.log('  Password:', TEST_PASSWORD);
  }
}

main().catch(console.error);

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  // Clean up first
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'ratelimit-test@example.com');
  if (testUser) {
    await supabase.auth.admin.deleteUser(testUser.id);
    console.log('✓ Cleaned up existing test user');
  }

  // Create new test user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'ratelimit-test@example.com',
    password: 'CorrectPass123!',
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }

  console.log('✓ Created test user: ratelimit-test@example.com / CorrectPass123!');
}

createTestUser();

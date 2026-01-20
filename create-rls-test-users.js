// Create test users for Feature #21 RLS testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const USERS = [
  {
    email: 'test@example.com',
    password: 'testpass123',
    email_confirm: true
  },
  {
    email: 'test2@example.com',
    password: 'testpass456',
    email_confirm: true
  }
];

async function createTestUsers() {
  console.log('Creating test users for RLS testing...\n');

  for (const userData of USERS) {
    try {
      // Check if user already exists
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === userData.email);

      if (existingUser) {
      console.log(`✓ User ${userData.email} already exists`);
      } else {
        // Create user
        const { data, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: userData.email_confirm,
          user_metadata: {
            test_user: true,
            created_for: 'Feature #21 RLS testing'
          }
        });

        if (error) {
          console.log(`✗ Failed to create ${userData.email}: ${error.message}`);
        } else {
          console.log(`✓ Created user ${userData.email}`);
          console.log(`  ID: ${data.user.id}`);
        }
      }
    } catch (error) {
      console.log(`✗ Error with ${userData.email}: ${error.message}`);
    }
  }

  console.log('\nDone! Users ready for RLS testing.');
}

createTestUsers();

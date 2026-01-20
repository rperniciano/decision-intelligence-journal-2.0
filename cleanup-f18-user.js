require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'feature18-test@example.com');
  if (testUser) {
    await supabase.auth.admin.deleteUser(testUser.id);
    console.log('✓ Cleaned up test user: feature18-test@example.com');
  } else {
    console.log('✓ No test user to clean up');
  }
}

cleanup();

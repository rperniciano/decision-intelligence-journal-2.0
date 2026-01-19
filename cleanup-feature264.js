const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupTestData() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'feature264test@example.com');

  if (!testUser) {
    console.log('Test user not found');
    return;
  }

  // Delete test decisions
  const { error } = await supabase
    .from('decisions')
    .delete()
    .in('title', [
      'JAN_2026_Decision_1_F264',
      'JAN_2026_Decision_2_F264',
      'DEC_2025_Decision_F264',
      'NOV_2025_Decision_F264',
    ])
    .eq('user_id', testUser.id);

  if (error) {
    console.error('Error deleting test decisions:', error);
  } else {
    console.log('Test decisions deleted successfully');
  }
}

cleanupTestData().catch(console.error);

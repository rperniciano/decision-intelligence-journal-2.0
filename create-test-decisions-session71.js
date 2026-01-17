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

async function createTestDecisions() {
  const email = 'session71test@example.com';

  // Get user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log(`Creating decisions for user: ${user.id}`);

  // Create 15 test decisions
  for (let i = 1; i <= 15; i++) {
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        title: `PAGINATION_TEST_DECISION_${i}`,
        status: 'decided',
        category_id: null,
        description: `Test decision ${i} for pagination testing`
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating decision ${i}:`, error);
    } else {
      console.log(`Created decision ${i}: ${data.id}`);
    }
  }

  console.log('All test decisions created!');
}

createTestDecisions();

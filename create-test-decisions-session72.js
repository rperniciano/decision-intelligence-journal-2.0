const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecisions() {
  // Get the test user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'session72test@example.com');

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Creating 15 test decisions for pagination...');

  // Create 15 decisions
  const decisions = [];
  for (let i = 1; i <= 15; i++) {
    decisions.push({
      user_id: user.id,
      title: `PAGINATION_TEST_DECISION_${i}`,
      status: 'decided',
      created_at: new Date(Date.now() - i * 60000).toISOString(), // Stagger timestamps
      updated_at: new Date(Date.now() - i * 60000).toISOString()
    });
  }

  const { data, error } = await supabase
    .from('decisions')
    .insert(decisions)
    .select();

  if (error) {
    console.error('Error creating decisions:', error);
  } else {
    console.log(`Created ${data.length} decisions successfully!`);
  }
}

createTestDecisions();

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setUpTestUserAndDecisions() {
  // Update user password
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'feature264test@example.com');

  if (!testUser) {
    console.log('User not found');
    return;
  }

  console.log('Using user:', testUser.email);

  // Update password to a known value
  await supabase.auth.admin.updateUserById(testUser.id, {
    password: 'Test123456!',
    email_confirm: true
  });
  console.log('Password updated to: Test123456!');

  // Create decisions across different months
  const decisions = [
    {
      user_id: testUser.id,
      title: 'JAN_2026_Decision_1_F264',
      status: 'decided',
      category_id: null, // No category for test
      created_at: new Date(2026, 0, 15, 12, 0, 0).toISOString(), // January 15, 2026
      decided_at: new Date(2026, 0, 15, 12, 30, 0).toISOString(),
    },
    {
      user_id: testUser.id,
      title: 'JAN_2026_Decision_2_F264',
      status: 'decided',
      category_id: null,
      created_at: new Date(2026, 0, 20, 14, 0, 0).toISOString(), // January 20, 2026
      decided_at: new Date(2026, 0, 20, 14, 30, 0).toISOString(),
    },
    {
      user_id: testUser.id,
      title: 'DEC_2025_Decision_F264',
      status: 'decided',
      category_id: null,
      created_at: new Date(2025, 11, 10, 10, 0, 0).toISOString(), // December 10, 2025
      decided_at: new Date(2025, 11, 10, 10, 30, 0).toISOString(),
    },
    {
      user_id: testUser.id,
      title: 'NOV_2025_Decision_F264',
      status: 'decided',
      category_id: null,
      created_at: new Date(2025, 10, 5, 9, 0, 0).toISOString(), // November 5, 2025
      decided_at: new Date(2025, 10, 5, 9, 30, 0).toISOString(),
    },
  ];

  console.log('\nCreating test decisions across months...');
  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select();

    if (error) {
      console.error('Error creating decision:', error.message);
    } else {
      console.log('Created:', decision.title, 'at', decision.created_at);
    }
  }

  console.log('\n✅ Setup complete!');
  console.log('Login with: feature264test@example.com / Test123456!');
  console.log('Go to History page and click Timeline view to see month grouping');
}

setUpTestUserAndDecisions().catch(console.error);

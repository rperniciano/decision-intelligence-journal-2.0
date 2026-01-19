const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findUser() {
  const { data: { users } } = await supabase.auth.admin.listUsers();

  if (users.length === 0) {
    console.log('No users found');
    return;
  }

  console.log('Found', users.length, 'users:');
  users.forEach(u => {
    console.log(`- ${u.email} (ID: ${u.id})`);
  });

  // Use the first user
  const user = users[0];
  console.log('\nUsing user:', user.email);

  return user;
}

async function createTestDecisions() {
  const testUser = await findUser();

  if (!testUser) {
    return;
  }

  // Create decisions across different months
  const decisions = [
    {
      user_id: testUser.id,
      title: 'JAN_2026_Decision_1_F264',
      status: 'decided',
      category: 'Testing',
      created_at: new Date(2026, 0, 15).toISOString(), // January 15, 2026
      decided_at: new Date(2026, 0, 15).toISOString(),
    },
    {
      user_id: testUser.id,
      title: 'JAN_2026_Decision_2_F264',
      status: 'decided',
      category: 'Testing',
      created_at: new Date(2026, 0, 20).toISOString(), // January 20, 2026
      decided_at: new Date(2026, 0, 20).toISOString(),
    },
    {
      user_id: testUser.id,
      title: 'DEC_2025_Decision_F264',
      status: 'decided',
      category: 'Testing',
      created_at: new Date(2025, 11, 10).toISOString(), // December 10, 2025
      decided_at: new Date(2025, 11, 10).toISOString(),
    },
    {
      user_id: testUser.id,
      title: 'NOV_2025_Decision_F264',
      status: 'decided',
      category: 'Testing',
      created_at: new Date(2025, 10, 5).toISOString(), // November 5, 2025
      decided_at: new Date(2025, 10, 5).toISOString(),
    },
  ];

  console.log('\nCreating test decisions...');
  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select();

    if (error) {
      console.error('Error creating decision:', error);
    } else {
      console.log('Created:', decision.title);
    }
  }

  console.log('\nDone! You can now test the History page Timeline view');
  console.log('User email:', testUser.email);
}

createTestDecisions().catch(console.error);

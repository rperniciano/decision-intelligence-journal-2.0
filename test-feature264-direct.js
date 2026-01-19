const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDecisions() {
  // Get the test user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'mobiletest@example.com');

  if (!testUser) {
    console.log('Test user not found');
    return;
  }

  console.log('Using user:', testUser.id);

  // Create decisions across different months
  const today = new Date();
  const decisions = [
    {
      user_id: testUser.id,
      title: 'January Decision 1 - Feature 264 Test',
      status: 'decided',
      category: 'Testing',
      created_at: new Date(2026, 0, 15).toISOString(), // January 15, 2026
      decided_at: new Date(2026, 0, 15).toISOString(),
    },
    {
      user_id: testUser.id,
      title: 'January Decision 2 - Feature 264 Test',
      status: 'decided',
      category: 'Testing',
      created_at: new Date(2026, 0, 20).toISOString(), // January 20, 2026
      decided_at: new Date(2026, 0, 20).toISOString(),
    },
    {
      user_id: testUser.id,
      title: 'December 2025 Decision - Feature 264 Test',
      status: 'decided',
      category: 'Testing',
      created_at: new Date(2025, 11, 10).toISOString(), // December 10, 2025
      decided_at: new Date(2025, 11, 10).toISOString(),
    },
  ];

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select();

    if (error) {
      console.error('Error creating decision:', error);
    } else {
      console.log('Created decision:', data[0].id, '-', decision.title);
    }
  }

  console.log('\nTest decisions created successfully!');
  console.log('You can now view them in the History page Timeline view');
}

createTestDecisions().catch(console.error);

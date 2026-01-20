// Script to create test decisions with different dates for Feature #200 testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://doqojfsldvajmlscpwhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcW9qZnNsZHZham1sc2Nwd2h1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk2Njc2NiwiZXhwIjoyMDgzNTQyNzY2fQ.y2zKyYqhH9C-sKKJwDvptLmH5yKI19uso9ZFt50_bwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDecisions() {
  const userEmail = 'feature200.test@example.com';

  // Get the user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === userEmail);

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('Creating test decisions for user:', user.id);

  // Create decisions with different dates
  const decisions = [
    {
      title: 'F200 Test Decision - Today',
      status: 'decided',
      category_id: null,
      user_id: user.id,
      created_at: new Date().toISOString(),
      emotional_state: 'confident',
      decided_at: new Date().toISOString(),
    },
    {
      title: 'F200 Test Decision - Yesterday',
      status: 'decided',
      category_id: null,
      user_id: user.id,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      emotional_state: 'thoughtful',
      decided_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F200 Test Decision - 3 Days Ago',
      status: 'decided',
      category_id: null,
      user_id: user.id,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      emotional_state: 'uncertain',
      decided_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F200 Test Decision - 1 Week Ago',
      status: 'decided',
      category_id: null,
      user_id: user.id,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      emotional_state: 'anxious',
      decided_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'F200 Test Decision - 2 Weeks Ago',
      status: 'decided',
      category_id: null,
      user_id: user.id,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
      emotional_state: 'calm',
      decided_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select();

    if (error) {
      console.error(`Error creating decision "${decision.title}":`, error.message);
    } else {
      console.log(`✓ Created: ${decision.title} at ${decision.created_at}`);
    }
  }

  console.log('\nTest decisions created successfully!');
}

createTestDecisions().catch(console.error);

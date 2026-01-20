const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUserAndDecisions() {
  const email = 'test_f285_search_perf@example.com';

  console.log('Creating test data for Feature #285: Search Performance...');

  // Get user ID from auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === email);

  if (!authUser) {
    console.error('User not found in auth. Please create user first using the UI.');
    return;
  }

  const userId = authUser.id;
  console.log('Found user:', email);

  // Delete existing decisions
  const { error: deleteError } = await supabase
    .from('decisions')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting existing decisions:', deleteError);
  } else {
    console.log('Deleted existing decisions');
  }

  // Create 150 decisions with searchable titles
  console.log('Creating 150 decisions for search performance testing...');

  const statuses = ['draft', 'in_progress', 'decided', 'abandoned'];

  const decisions = [];

  for (let i = 1; i <= 150; i++) {
    const status = statuses[i % statuses.length];

    // Create varied titles for search testing
    let title;
    if (i % 5 === 0) {
      title = `F285_TEST_DECISION_${i} - Important choice`;
    } else if (i % 3 === 0) {
      title = `Career decision option ${i}`;
    } else {
      title = `F285_Search Test Decision ${i}`;
    }

    decisions.push({
      user_id: userId,
      title: title,
      status: status,
      description: `Performance test decision #${i} for search testing`,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Batch insert decisions
  const { data: insertedDecisions, error: insertError } = await supabase
    .from('decisions')
    .insert(decisions)
    .select('id');

  if (insertError) {
    console.error('Error inserting decisions:', insertError);
    return;
  }

  console.log(`✅ Created ${insertedDecisions.length} decisions`);
  console.log(`✅ User: ${email}`);
  console.log(`✅ Password: Test1234!`);
  console.log('');
  console.log('Test data ready for Feature #285: Search Performance Verification');
  console.log('- Total decisions: 150');
  console.log('- Searchable patterns: "F285_TEST", "F285_Search", "Career decision"');
}

createTestUserAndDecisions().catch(console.error);

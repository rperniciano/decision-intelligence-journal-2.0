// Feature #108: Create a decision and delete it for 404 testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAndDeleteDecision() {
  console.log('Feature #108: Creating decision for 404 test...\n');

  // Get the test user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users[0];
  const userId = user.id;
  console.log('✅ Using user:', user.email);

  // Get a category
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  const categoryId = categories[0].id;

  // Create the decision
  const { data: decision } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F108: This decision will be deleted',
      status: 'draft',
      category_id: categoryId,
    })
    .select()
    .single();

  console.log('\n✅ Created decision:');
  console.log('   ID:', decision.id);
  console.log('   URL:', `http://localhost:5173/decisions/${decision.id}`);

  // Save the ID
  const decisionId = decision.id;

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 500));

  // Delete the decision
  await supabase
    .from('decisions')
    .delete()
    .eq('id', decisionId);

  console.log('\n✅ Decision deleted');
  console.log('\nNow test: Navigate to', `http://localhost:5173/decisions/${decisionId}`);
  console.log('Expected: Should see a 404/Not Found page');
}

createAndDeleteDecision().catch(console.error);

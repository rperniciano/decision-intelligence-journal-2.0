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

async function createTestDecision() {
  console.log('Creating test decision for Feature #108...');

  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error('No users found');
    return;
  }

  const user = users[0];
  const userId = user.id;
  console.log('✅ Using user:', user.email, '(' + userId + ')');

  // Get a category ID
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (!categories || categories.length === 0) {
    console.error('No categories found');
    return;
  }

  const categoryId = categories[0].id;
  console.log('✅ Using category:', categories[0].name, '(' + categoryId + ')');

  // Create a test decision
  const decisionData = {
    user_id: userId,
    title: 'F108: Test Decision for Deletion',
    status: 'pending',
    category_id: categoryId,
    created_at: new Date().toISOString()
  };

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert(decisionData)
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('\n✅ Created test decision:');
  console.log('   ID:', decision.id);
  console.log('   Title:', decision.title);
  console.log('   URL:', `http://localhost:5173/decisions/${decision.id}`);
  console.log('\nNext steps:');
  console.log('1. Navigate to the URL above');
  console.log('2. Copy the URL');
  console.log('3. Delete the decision');
  console.log('4. Try to navigate to the copied URL');
  console.log('5. Verify 404 page is shown');
}

createTestDecision().catch(console.error);

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

async function createDecisionForUITest() {
  console.log('Creating decision for UI verification...\n');

  const timeNow = new Date();
  console.log('Current time:', timeNow.toISOString());

  // Get the test user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users[0];
  const userId = user.id;

  // Get a category ID
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(1);
  const categoryId = categories[0].id;

  // Create a test decision
  const decisionData = {
    user_id: userId,
    title: 'F63 UI Test: Timestamp Verification',
    description: 'This decision was created at: ' + timeNow.toISOString(),
    status: 'draft',
    category_id: categoryId
  };

  const { data: decision, error } = await supabase
    .from('decisions')
    .insert(decisionData)
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n✅ Decision created!');
  console.log('   ID:', decision.id);
  console.log('   Title:', decision.title);
  console.log('   Created at:', decision.created_at);
  console.log('\n📱 Navigate to in browser:');
  console.log('   http://localhost:5173/decisions/' + decision.id);
  console.log('\n⏱️  Compare timestamps:');
  console.log('   Expected: ~', timeNow.toISOString());
  console.log('   Actual:   ', decision.created_at);
}

createDecisionForUITest().catch(console.error);

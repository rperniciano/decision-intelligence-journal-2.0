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

async function createTestDecisionForF34() {
  console.log('Creating test decision for Feature #34 (Deep linking)...');

  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error('❌ No users found in database');
    console.log('\n⚠️  Cannot test Feature #34 without a user in the database.');
    console.log('Please create a test user first by registering through the app.');
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
    console.error('❌ No categories found');
    return;
  }

  const categoryId = categories[0].id;
  console.log('✅ Using category:', categories[0].name, '(' + categoryId + ')');

  // Create a test decision for deep linking
  const decisionData = {
    user_id: userId,
    title: 'F34: Test Decision for Deep Linking',
    description: 'This is a test decision to verify deep linking functionality works when authenticated.',
    status: 'draft',
    category_id: categoryId,
    created_at: new Date().toISOString()
  };

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert(decisionData)
    .select()
    .single();

  if (decisionError) {
    console.error('❌ Error creating decision:', decisionError);
    return;
  }

  console.log('\n✅ Created test decision:');
  console.log('   ID:', decision.id);
  console.log('   Title:', decision.title);
  console.log('   User ID:', userId);
  console.log('\n📋 Deep Link URL:');
  console.log('   ' + `http://localhost:5173/decisions/${decision.id}`);
  console.log('\n📝 Test Steps:');
  console.log('   1. Log in as:', user.email);
  console.log('   2. Navigate to dashboard');
  console.log('   3. Copy the decision ID:', decision.id);
  console.log('   4. Open new tab with URL:', `http://localhost:5173/decisions/${decision.id}`);
  console.log('   5. Verify the decision detail page loads correctly');
}

createTestDecisionForF34().catch(console.error);

// Feature #108: Test 404 handling for deleted decisions
// This script will:
// 1. Create a test user
// 2. Create a decision
// 3. Log in to get a session token
// 4. Delete the decision
// 5. Output the instructions for testing

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTest() {
  console.log('=== Feature #108: 404 Handling Test Setup ===\n');

  // 1. Get or create test user
  const email = 'f108-404-test@example.com';
  const password = 'Test1234!';

  console.log('1. Setting up test user...');
  let userId;

  try {
    // Try to create user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'F108 404 Test User' }
    });

    if (userError && !userError.message.includes('already exists')) {
      throw userError;
    }

    if (userData.user) {
      userId = userData.user.id;
      console.log('   ✅ Created new user:', userId);
    } else {
      // User exists, get their ID
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === email);
      userId = existingUser.id;
      console.log('   ✅ Using existing user:', userId);
    }
  } catch (err) {
    console.error('   ❌ Error with user:', err.message);
    return;
  }

  // 2. Get a category
  console.log('\n2. Getting category...');
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (!categories || categories.length === 0) {
    console.log('   ❌ No categories found');
    return;
  }

  const categoryId = categories[0].id;
  console.log('   ✅ Using category:', categories[0].name);

  // 3. Create a decision
  console.log('\n3. Creating test decision...');
  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F108: This decision will be deleted to test 404',
      status: 'draft',
      category_id: categoryId,
    })
    .select()
    .single();

  if (decisionError) {
    console.error('   ❌ Error creating decision:', decisionError);
    return;
  }

  const decisionId = decision.id;
  console.log('   ✅ Created decision ID:', decisionId);
  console.log('   URL: http://localhost:5173/decisions/' + decisionId);

  // 4. Delete the decision
  console.log('\n4. Deleting decision...');
  await supabase
    .from('decisions')
    .delete()
    .eq('id', decisionId);

  console.log('   ✅ Decision deleted');

  // 5. Output test instructions
  console.log('\n=== TEST INSTRUCTIONS ===');
  console.log('\n1. Open browser and go to: http://localhost:5173/login');
  console.log(`2. Login with:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`3. Navigate to: http://localhost:5173/decisions/${decisionId}`);
  console.log('\n=== EXPECTED RESULTS ===');
  console.log('✅ Should see error page (not a blank screen or crash)');
  console.log('✅ Error message: "Decision not found"');
  console.log('✅ No console errors');
  console.log('✅ Navigation options available (link to History)');
  console.log('✅ User can click "History" to return to the app');
}

setupTest().catch(console.error);

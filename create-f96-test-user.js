const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createTestUser() {
  console.log('Creating test user for Feature #96...');

  // Create user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'f96-restore-test@example.com',
    password: 'Test123456!',
    email_confirm: true
  });

  if (userError) {
    // User might already exist, try to get it
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === 'f96-restore-test@example.com');

    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      console.log('   ID:', existingUser.id);

      // Create test decision for this user
      await createTestDecision(existingUser.id, existingUser.email);
    } else {
      console.error('Error creating user:', userError);
    }
    return;
  }

  console.log('✅ Created user:', userData.user.email);
  console.log('   ID:', userData.user.id);
  console.log('   Password: Test123456');

  await createTestDecision(userData.user.id, userData.user.email);
}

async function createTestDecision(userId, userEmail) {
  // Get a category
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (!categories || categories.length === 0) {
    console.error('No categories found');
    return;
  }

  const categoryId = categories[0].id;
  console.log('\n✅ Using category:', categories[0].name);

  // Create test decision
  const decisionData = {
    user_id: userId,
    title: 'F96: Test Decision for Restore Workflow',
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
    console.error('Error creating decision:', decisionError);
    return;
  }

  console.log('\n✅ Created test decision:');
  console.log('   ID:', decision.id);
  console.log('   Title:', decision.title);
  console.log('   URL:', `http://localhost:5173/decisions/${decision.id}`);
  console.log('\n🔐 Sign in with:');
  console.log('   Email: f96-restore-test@example.com');
  console.log('   Password: Test123456');
}

createTestUser().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkUsersAndCreateDecision() {
  console.log('Checking existing users...');

  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error('No users found');
    return;
  }

  console.log('Found', users.length, 'users:');
  users.forEach(u => console.log(' -', u.email, '(' + u.id + ')'));

  // Use first user
  const user = users[0];
  const userId = user.id;

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

  // Create a test decision for restore testing
  const decisionData = {
    user_id: userId,
    title: 'F96: Test Decision for Restore Workflow',
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
  console.log('   User:', user.email);
  console.log('   URL:', `http://localhost:5173/decisions/${decision.id}`);
  console.log('\nYou can now sign in as:', user.email);
}

checkUsersAndCreateDecision().catch(console.error);

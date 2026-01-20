const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function prepareF179Test() {
  console.log('Preparing test data for Feature #179: Permanent delete removes all traces');

  // Get the first test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error('❌ No users found');
    return;
  }

  const user = users[0];
  const userId = user.id;
  console.log('✅ Using user:', user.email, '(' + userId + ')');

  // Get a category
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (!categories || categories.length === 0) {
    console.error('❌ No categories found');
    return;
  }

  const categoryId = categories[0].id;
  console.log('✅ Using category:', categories[0].name);

  // Create a test decision that will be soft deleted then permanently deleted
  const decisionData = {
    user_id: userId,
    title: 'F179: Test Decision for Permanent Delete',
    description: 'This decision will be soft deleted then permanently deleted to verify no traces remain.',
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
    console.error('❌ Error creating decision:', decisionError.message);
    return;
  }

  console.log('✅ Created test decision:', decision.id);
  console.log('   Title:', decision.title);

  // Now soft delete it
  const { error: deleteError } = await supabase
    .from('decisions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', decision.id);

  if (deleteError) {
    console.error('❌ Error soft deleting decision:', deleteError.message);
    return;
  }

  console.log('✅ Soft deleted decision');
  console.log('\n📋 Test data ready:');
  console.log('   Email:', user.email);
  console.log('   Decision ID:', decision.id);
  console.log('   Status: Soft deleted (in trash)');
  console.log('\nNext steps:');
  console.log('1. Sign in as this user');
  console.log('2. Go to History > Trash tab');
  console.log('3. Select this decision and permanently delete it');
  console.log('4. Verify it no longer appears in Trash, History, or Search');
}

prepareF179Test().catch(console.error);

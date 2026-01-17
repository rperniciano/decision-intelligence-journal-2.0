const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDecision() {
  // User: session24test@example.com
  const userId = '09e4382a-1624-4d27-8717-416bc158e76f';

  // Get Career category ID
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('name', 'Career')
    .single();

  if (catError || !categories) {
    console.error('Error finding Career category:', catError);
    console.log('Fetching first available category...');
    const { data: firstCat } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1)
      .single();

    if (!firstCat) {
      console.error('No categories found');
      process.exit(1);
    }
    console.log('Using category:', firstCat.name);
    var categoryId = firstCat.id;
  } else {
    var categoryId = categories.id;
    console.log('Using category: Career');
  }

  const decision = {
    user_id: userId,
    title: 'TRASH_TEST_ITEM',
    status: 'decided',
    category_id: categoryId,
    description: 'Test decision for trash verification',
    decided_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('decisions')
    .insert(decision)
    .select()
    .single();

  if (error) {
    console.error('Error creating decision:', error);
    process.exit(1);
  }

  console.log('✓ Created decision:', data.id);
  console.log('  Title:', data.title);
  console.log('  Status:', data.status);
  console.log('  Category:', data.category);
  console.log('  User:', data.user_id);
}

createDecision();

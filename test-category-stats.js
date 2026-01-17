import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_EMAIL = 'session21test@example.com';

async function testCategoryStats() {
  console.log('Testing Category Statistics Feature...\n');

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  const user = users.find(u => u.email === USER_EMAIL);
  if (!user) {
    console.error('User not found:', USER_EMAIL);
    return;
  }

  const userId = user.id;
  console.log('User ID:', userId);

  // Step 1: Create or find custom category 'STATS_TEST_CAT'
  console.log('\n1. Finding or creating custom category "STATS_TEST_CAT"...');

  let category;

  // Try to find existing category
  const { data: existingCat } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('slug', 'stats-test-cat')
    .single();

  if (existingCat) {
    console.log('Found existing category:', existingCat.name, '(ID:', existingCat.id, ')');
    category = existingCat;
  } else {
    // Create new category
    const { data: newCat, error: catError } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: 'STATS_TEST_CAT',
        slug: 'stats-test-cat',
        description: 'Test category for statistics feature',
        icon: '📊',
        color: '#FF6B6B',
        is_system: false,
      })
      .select()
      .single();

    if (catError) {
      console.error('Error creating category:', catError);
      return;
    }

    console.log('Category created:', newCat.name, '(ID:', newCat.id, ')');
    category = newCat;
  }

  // Step 2: Check initial decision count (should be 0)
  console.log('\n2. Checking initial decision count for STATS_TEST_CAT...');

  const { data: initialDecisions, error: countError1 } = await supabase
    .from('decisions')
    .select('id')
    .eq('user_id', userId)
    .eq('category_id', category.id);

  if (countError1) {
    console.error('Error counting decisions:', countError1);
    return;
  }

  console.log('Initial decision count:', initialDecisions?.length || 0);

  // Step 3: Create 2 decisions in STATS_TEST_CAT
  console.log('\n3. Creating 2 decisions in STATS_TEST_CAT...');

  const decisions = [
    {
      user_id: userId,
      category_id: category.id,
      title: 'STATS_TEST_DECISION_1',
      status: 'decided',
      detected_emotional_state: 'confident',
      created_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      category_id: category.id,
      title: 'STATS_TEST_DECISION_2',
      status: 'decided',
      detected_emotional_state: 'calm',
      created_at: new Date().toISOString(),
    },
  ];

  const { data: createdDecisions, error: createError } = await supabase
    .from('decisions')
    .insert(decisions)
    .select();

  if (createError) {
    console.error('Error creating decisions:', createError);
    return;
  }

  console.log('Created', createdDecisions?.length, 'decisions');
  createdDecisions?.forEach((d, i) => {
    console.log(`  - Decision ${i + 1}:`, d.title, '(ID:', d.id, ')');
  });

  // Step 4: Check updated decision count (should be 2)
  console.log('\n4. Checking updated decision count for STATS_TEST_CAT...');

  const { data: updatedDecisions, error: countError2 } = await supabase
    .from('decisions')
    .select('id')
    .eq('user_id', userId)
    .eq('category_id', category.id);

  if (countError2) {
    console.error('Error counting decisions:', countError2);
    return;
  }

  console.log('Updated decision count:', updatedDecisions?.length || 0);

  console.log('\n✅ Test setup complete!');
  console.log('Now check the Insights page - Category Performance should show:');
  console.log('   "STATS_TEST_CAT: 2 decisions"');
}

testCategoryStats();

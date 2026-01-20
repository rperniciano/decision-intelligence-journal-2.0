const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestData() {
  const email = 'test_f277@example.com';
  const password = 'test123456';

  // Try to get user by email from auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingAuthUser = users.find(u => u.email === email);
  let userId;

  if (existingAuthUser) {
    console.log('User already exists in auth, deleting old data...');
    userId = existingAuthUser.id;

    // Delete existing decisions
    await supabase
      .from('decisions')
      .delete()
      .eq('user_id', userId);

    // Delete existing categories
    await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId);

    console.log('Deleted existing data');
  } else {
    // Create user using auth admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return;
    }

    userId = authData.user.id;
    console.log('Created user:', email);
  }

  // Create category
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: 'F277_Career',
      slug: 'f277-career',
      icon: 'briefcase',
      color: '#00d4aa',
    })
    .select()
    .single();

  if (categoryError) {
    console.error('Error creating category:', categoryError);
    return;
  }

  const category = categoryData;
  console.log('Created category:', category.id);

  // Create decisions with various statuses
  const decisions = [
    {
      user_id: userId,
      category_id: category.id,
      title: 'F277_TEST: Job Offer Decision 1',
      status: 'draft',
    },
    {
      user_id: userId,
      category_id: category.id,
      title: 'F277_TEST: Job Offer Decision 2',
      status: 'in_progress',
    },
    {
      user_id: userId,
      category_id: category.id,
      title: 'F277_TEST: Job Offer Decision 3',
      status: 'decided',
      decided_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      category_id: category.id,
      title: 'F277_TEST: Apartment Lease Decision',
      status: 'abandoned',
    },
    {
      user_id: userId,
      category_id: category.id,
      title: 'F277_TEST: Car Purchase Decision',
      status: 'draft',
    },
  ];

  const { data: createdDecisions, error: decisionsError } = await supabase
    .from('decisions')
    .insert(decisions)
    .select();

  if (decisionsError) {
    console.error('Error creating decisions:', decisionsError);
    return;
  }

  console.log(`Created ${createdDecisions.length} decisions`);

  // Add options to some decisions
  for (let i = 0; i < 3; i++) {
    const decision = createdDecisions[i];
    const options = [
      {
        decision_id: decision.id,
        title: `F277: Option A for decision ${i + 1}`,
        is_chosen: i === 2, // Mark chosen for the decided decision
        order_index: 0,
      },
      {
        decision_id: decision.id,
        title: `F277: Option B for decision ${i + 1}`,
        is_chosen: false,
        order_index: 1,
      },
    ];

    await supabase.from('decision_options').insert(options);
  }

  console.log('Added options to first 3 decisions');

  // Count total decisions
  const { count } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log('\n=== Test Data Summary ===');
  console.log(`User: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Total decisions: ${count}`);
  console.log('Decisions by status:');
  console.log('  - pending: 2');
  console.log('  - in_progress: 1');
  console.log('  - decided: 1');
  console.log('  - abandoned: 1');
  console.log('\nExpected CSV rows: 5 (header + 5 decisions)');
}

createTestData().catch(console.error);

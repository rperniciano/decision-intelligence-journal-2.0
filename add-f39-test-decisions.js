const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function addTestDecisions() {
  console.log('Creating test decisions for Feature #39...');

  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error('No users found');
    return;
  }

  // Use the F39 test user
  const user = users.find(u => u.email === 'test-f39-persistence@example.com');
  if (!user) {
    console.error('F39 test user not found');
    return;
  }

  console.log('✅ Using user:', user.email);

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  if (!categories || categories.length === 0) {
    console.error('No categories found');
    return;
  }

  console.log('✅ Found', categories.length, 'categories');

  // Create decisions in different categories
  const decisions = [
    {
      user_id: user.id,
      title: 'F39: Career Decision - Tech Job Offer',
      description: 'Choosing between two tech companies',
      status: 'draft',
      category_id: categories[0].id,
      created_at: new Date().toISOString()
    },
    {
      user_id: user.id,
      title: 'F39: Health Decision - Gym Membership',
      description: 'Deciding on a fitness plan',
      status: 'draft',
      category_id: categories[1]?.id || categories[0].id,
      created_at: new Date().toISOString()
    },
    {
      user_id: user.id,
      title: 'F39: Finance Decision - Investment',
      description: 'Investment options analysis',
      status: 'draft',
      category_id: categories[2]?.id || categories[0].id,
      created_at: new Date().toISOString()
    }
  ];

  for (const decision of decisions) {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select()
      .single();

    if (error) {
      console.error('Error creating decision:', error.message);
    } else {
      console.log('✅ Created:', data.title, '(ID:', data.id, ')');
    }
  }

  console.log('\n✅ Test decisions created successfully!');
}

addTestDecisions().catch(console.error);

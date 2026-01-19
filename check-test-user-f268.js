const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findTestUser() {
  const { data: { users } } = await supabase.auth.admin.listUsers();

  // Find a user with decisions
  for (const user of users) {
    const { data: decisions } = await supabase
      .from('decisions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (decisions && decisions.length > 0) {
      console.log('\nFound test user with decisions:');
      console.log(`  Email: ${user.email}`);
      console.log(`  ID: ${user.id}`);

      // Get total decision count
      const { count } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      console.log(`  Decision count: ${count}`);

      // Reset password if needed
      console.log(`\nTo reset password, run:`);
      console.log(`  node -e "const supabase = require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.auth.admin.updateUserById('${user.id}', { password: 'test123456' }).then(() => console.log('Password reset to test123456'))"`);
      return;
    }
  }

  console.log('No users with decisions found. Creating new test user...');

  const password = 'test123456';
  const email = `test_f268_${Date.now()}@example.com`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error('Error creating user:', error);
    return;
  }

  console.log(`\n✓ Created test user:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  ID: ${data.user.id}`);

  // Create a category
  const { data: category } = await supabase
    .from('categories')
    .insert({
      user_id: data.user.id,
      name: 'Test Category',
      slug: 'test-category',
      color: '#00d4aa',
      icon: '🧪',
    })
    .select()
    .single();

  // Create 30 decisions spread across pages
  const decisions = [];
  for (let i = 0; i < 30; i++) {
    const page = i < 10 ? 1 : i < 20 ? 2 : 3;
    decisions.push({
      user_id: data.user.id,
      category_id: category.id,
      title: `PAGE_${page}_DECISION_${String(i % 10 + 1).padStart(3, '0')}`,
      status: 'decided',
      created_at: new Date(Date.now() - (30 - i) * 1000).toISOString(),
      recorded_at: new Date(Date.now() - (30 - i) * 1000).toISOString(),
    });
  }

  await supabase.from('decisions').insert(decisions);

  console.log(`  Created 30 decisions (10 per page)`);
}

findTestUser().catch(console.error);

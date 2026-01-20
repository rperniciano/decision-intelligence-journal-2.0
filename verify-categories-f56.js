const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyCategories() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === 'feature56-test@example.com');

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User ID:', user.id);

  // Fetch categories directly from database
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  if (error) {
    console.log('Error fetching categories:', error);
    return;
  }

  console.log('\nCategories in database:');
  categories.forEach(cat => {
    console.log(`- ${cat.icon} ${cat.name} (slug: ${cat.slug})`);
  });

  // Check if custom category exists
  const customCat = categories.find(c => c.name === 'MY_CUSTOM_CAT_123');
  console.log('\n✅ Custom category MY_CUSTOM_CAT_123 in database:', !!customCat);
  if (customCat) {
    console.log('   ID:', customCat.id);
    console.log('   Created at:', customCat.created_at);
  }
}

verifyCategories().then(() => process.exit(0));

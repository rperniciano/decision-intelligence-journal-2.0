const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefresh: false,
      persistSession: false
    }
  }
);

async function addTestCategory() {
  const email = 'feature56-test@example.com';

  // Get user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Found User ID:', user.id);

  // Create a test category
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: 'MY_CUSTOM_CAT_123',
      slug: 'my-custom-cat-123',
      icon: '🔧',
      color: '#FF0000'
    })
    .select()
    .single();

  if (categoryError) {
    console.log('Category error:', categoryError.message);
    if (categoryError.message.includes('duplicate')) {
      console.log('Category already exists, fetching...');
      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'MY_CUSTOM_CAT_123')
        .single();
      console.log('Existing category ID:', existing.id);
    }
  } else {
    console.log('Created category:', categoryData.name, 'ID:', categoryData.id);
  }
}

addTestCategory().then(() => process.exit(0));

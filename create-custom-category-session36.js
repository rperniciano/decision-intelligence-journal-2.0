const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCustomCategory() {
  // Get the user ID first
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  const user = users.users.find(u => u.email === 'session35test@example.com');
  if (!user) {
    console.error('User not found');
    return;
  }

  console.log('User ID:', user.id);

  // Create custom category
  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: 'MY_CUSTOM_CAT_123',
      slug: 'my_custom_cat_123',
      description: 'Test custom category for regression testing',
      icon: '🧪',
      color: '#FF00FF',
      is_system: false,
      display_order: 999
    })
    .select();

  if (error) {
    console.error('Error creating category:', error);
  } else {
    console.log('Custom category created:', data);
  }
}

createCustomCategory();

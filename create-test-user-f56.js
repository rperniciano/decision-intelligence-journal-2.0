const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role to bypass confirmation
  {
    auth: {
      autoRefresh: false,
      persistSession: false
    }
  }
);

async function createConfirmedTestUser() {
  // Create user with service role (bypasses email confirmation)
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'feature56-test@example.com',
    password: 'Test123456',
    email_confirm: true,
    user_metadata: {
      name: 'Feature 56 Test User'
    }
  });

  if (userError) {
    console.log('User error:', userError.message);
    if (userError.message.includes('already exists')) {
      console.log('User already exists, fetching...');
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === 'feature56-test@example.com');
      console.log('Existing User ID:', existingUser.id);
      return existingUser.id;
    }
    return;
  }

  console.log('Created User ID:', userData.user.id);
  console.log('Email confirmed:', userData.user.confirmed_at);

  // Create a test category
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .insert({
      user_id: userData.user.id,
      name: 'MY_CUSTOM_CAT_123',
      slug: 'my-custom-cat-123',
      icon: '🔧',
      color: '#FF0000'
    })
    .select()
    .single();

  if (categoryError) {
    console.log('Category error:', categoryError.message);
  } else {
    console.log('Created category:', categoryData.name, 'ID:', categoryData.id);
  }

  return userData.user.id;
}

createConfirmedTestUser().then(() => process.exit(0));

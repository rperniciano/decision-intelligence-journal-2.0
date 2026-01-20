const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTestUser() {
  console.log('Creating test user for Feature #34...');

  const testEmail = 'test-f34@example.com';
  const testPassword = 'test123456';

  // Try to create user
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('✅ User already exists:', testEmail);
      console.log('   Password:', testPassword);

      // Get the user ID
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users.find(u => u.email === testEmail);
      if (user) {
        console.log('   User ID:', user.id);
        return { userId: user.id, email: testEmail, password: testPassword };
      }
    } else {
      console.error('❌ Error creating user:', error.message);
      return null;
    }
  } else {
    console.log('✅ Created test user:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    console.log('   User ID:', data.user.id);

    // Get a category ID
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (!categories || categories.length === 0) {
      console.error('❌ No categories found');
      return { userId: data.user.id, email: testEmail, password: testPassword };
    }

    const categoryId = categories[0].id;

    // Create a test decision for this user
    const decisionData = {
      user_id: data.user.id,
      title: 'F34: Test Decision for Deep Linking',
      description: 'This is a test decision to verify deep linking functionality.',
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
      console.error('❌ Error creating decision:', decisionError);
    } else {
      console.log('\n✅ Created test decision:');
      console.log('   ID:', decision.id);
      console.log('   URL:', `http://localhost:5173/decisions/${decision.id}`);
    }

    return { userId: data.user.id, email: testEmail, password: testPassword, decisionId: decision?.id };
  }
}

createTestUser().then(result => {
  if (result) {
    console.log('\n📝 Login credentials:');
    console.log('   Email:', result.email);
    console.log('   Password:', result.password);
  }
}).catch(console.error);

/**
 * Create test user for Feature #83
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshUser: false,
    persistSession: false
  }
});

async function createTestUser() {
  const testEmail = 'f83-options-test@example.com';
  const testPassword = 'test123456';

  console.log('Creating test user for Feature #83...\n');

  // Create user using admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  });

  if (error) {
    // User might already exist
    if (error.message.includes('already been registered')) {
      console.log('✅ User already exists');

      // Get existing user
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === testEmail);

      if (existingUser) {
        console.log(`   User ID: ${existingUser.id}`);
        console.log(`   Email: ${existingUser.email}`);

        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', existingUser.id)
          .single();

        if (!profile) {
          // Create profile
          await supabase
            .from('profiles')
            .insert({
              id: existingUser.id,
              email: existingUser.email,
              full_name: 'F83 Test User',
              created_at: new Date().toISOString()
            });
          console.log('   ✅ Created profile');
        } else {
          console.log('   ✅ Profile exists');
        }
      }

      return existingUser.id;
    }

    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }

  console.log(`✅ User created: ${data.user.id}`);
  console.log(`   Email: ${testEmail}`);

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      email: testEmail,
      full_name: 'F83 Test User',
      created_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('❌ Error creating profile:', profileError.message);
    process.exit(1);
  }

  console.log('✅ Profile created');

  return data.user.id;
}

createTestUser()
  .then(userId => {
    console.log(`\n✅ Test user ready! User ID: ${userId}`);
    console.log('Now you can create the test decision.\n');
  })
  .catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });

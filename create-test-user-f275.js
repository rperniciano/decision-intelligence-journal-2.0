const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env' });

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAuth = require('@supabase/supabase-js').createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createTestUser() {
  const email = 'test_f275_all_fields@example.com';
  const password = 'Test1234!';

  console.log('Creating test user for Feature #275...');
  console.log('Email:', email);

  try {
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabaseAuth.auth.admin.listUsers();

    if (!checkError) {
      const userExists = existingUser.users.find(u => u.email === email);
      if (userExists) {
        console.log('User already exists, ID:', userExists.id);
        console.log('\nYou can log in with:');
        console.log('  Email:', email);
        console.log('  Password:', password);
        return userExists.id;
      }
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Test User F275' }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    const userId = authData.user.id;
    console.log('✓ Auth user created, ID:', userId);

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: 'Test User F275',
        decision_score: 50,
        total_decisions: 0,
        positive_outcome_rate: 0
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    console.log('✓ Profile created');
    console.log('\nYou can log in with:');
    console.log('  Email:', email);
    console.log('  Password:', password);

    return userId;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

createTestUser()
  .then(userId => {
    console.log('\nDone! User ID:', userId);
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestUser() {
  const email = 'test-f10-logout@example.com';
  const password = 'TestPassword123!';

  console.log('Creating test user for Feature #10 logout testing...');

  // Create user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'F10 Test User',
      }
    }
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    if (authError.message.includes('already')) {
      console.log('User already exists, proceeding with test...');
      console.log('Email:', email);
      console.log('Password:', password);
    }
    return;
  }

  console.log('Auth user created:', authData.user?.id);

  // Verify email automatically (by setting confirmed_at in profiles)
  if (authData.user?.id) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq('id', authData.user.id);

    if (updateError) {
      console.log('Note: Could not auto-confirm email:', updateError.message);
    }
  }

  console.log('\nTest user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', authData.user?.id);
  console.log('\nNote: You may need to confirm email in Supabase Dashboard');
}

createTestUser().catch(console.error);

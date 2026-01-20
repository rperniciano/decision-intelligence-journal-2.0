const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createConfirmedUser() {
  const email = 'f286-console-test@example.com';
  const password = 'Test123456';

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log('User already exists');
    console.log('Email:', email);
    console.log('Password:', password);
    return;
  }

  // Create user with admin API to bypass email confirmation
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'F286 Console Test User'
    }
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    process.exit(1);
  }

  console.log('Created confirmed test user:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', authData.user?.id);
}

createConfirmedUser();

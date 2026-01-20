const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTestUser() {
  const email = 'test_f125@example.com';
  const password = 'test123456';

  // Check if user exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    console.log('User exists:', existing.id);
    return;
  }

  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) throw authError;

  console.log('Created user:', authData.user.id);
}

createTestUser().catch(console.error);

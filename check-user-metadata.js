const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserMetadata() {
  const userId = '09e4382a-1624-4d27-8717-416bc158e76f';

  const { data: user, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('User ID:', user.user.id);
  console.log('Email:', user.user.email);
  console.log('User metadata:', JSON.stringify(user.user.user_metadata, null, 2));
  console.log('Raw auth user:', JSON.stringify(user, null, 2));
}

checkUserMetadata();

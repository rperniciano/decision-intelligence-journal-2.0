const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  // Create user with auto-confirmed email
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'session58verified@example.com',
    password: 'testpass123',
    email_confirm: true,
    user_metadata: {
      name: 'Session 58 Verified User'
    }
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('User created:', data.user.id, data.user.email);
  }
}

createUser();

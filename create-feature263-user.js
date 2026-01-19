const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  const testEmail = 'feature263@test.com';
  const testPassword = 'password123';

  console.log('Creating user:', testEmail);

  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      name: 'Feature 263 Test User',
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'Europe/Rome'
    }
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('User already exists');
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.log('✓ User created:', data.user.id);
  }

  console.log('\nUser credentials:');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
}

createUser();

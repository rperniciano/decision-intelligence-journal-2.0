// Create test user for Feature #266
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('Creating test user for Feature #266...');

  const { data, error } = await supabase.auth.admin.createUser({
    email: 'feature266@test.com',
    password: 'test123456',
    email_confirm: true,
    user_metadata: {
      name: 'Feature 266 Test User'
    }
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('✓ User already exists');
    } else {
      console.error('✗ Error creating user:', error.message);
      throw error;
    }
  } else {
    console.log('✓ Test user created:', data.user.id);
  }
}

createTestUser();

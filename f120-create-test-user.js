const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestUser() {
  const email = `f120-regression-${Date.now()}@example.com`;
  const password = 'Test123456';

  console.log('Creating test user:', email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'Feature 120 Test User'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('User created successfully');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', data.user.id);

  // Auto-confirm user via admin API
  const { createClient: createAdminClient } = require('@supabase/supabase-js');
  const adminAuth = createAdminClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  await adminAuth.auth.admin.updateUserById(data.user.id, {
    email_confirm: true
  });

  console.log('User auto-confirmed');
}

createTestUser().catch(console.error);

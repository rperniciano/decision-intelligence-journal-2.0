import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  const email = 'testuser-f128@example.com';
  const password = 'testpass123';

  // Create user with auto-confirm
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'Test User F128'
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return;
  }

  console.log('✅ Test user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', data.user.id);
}

createTestUser();

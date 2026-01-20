import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createConfirmedUser() {
  const email = 'test_f272_slow@example.com';
  const password = 'testpass123';
  const name = 'Feature 272 Test';

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name
    }
  });

  if (authError) {
    console.log('Error:', authError.message);
    if (authError.message.includes('already been registered')) {
      console.log('User already exists, continuing...');
      return;
    }
    return;
  }

  console.log('Created confirmed user:', authData.user.id, email);
  console.log('Password:', password);
  console.log('\nYou can now login with these credentials.');
}

createConfirmedUser();

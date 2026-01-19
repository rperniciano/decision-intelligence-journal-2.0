import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createConfirmedUser() {
  const email = 'regression-test@example.com';
  const password = 'Test1234!';

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'Regression Test User'
    }
  });

  if (authError) {
    console.log('Error:', authError.message);
    return;
  }

  console.log('Created confirmed user:', authData.user.id, email);
  console.log('Password:', password);
}

createConfirmedUser();

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const email = 'feature218@test.com';
  const password = 'test123456';
  const name = 'Feature 218 Tester';

  try {
    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    console.log('✅ User created:', authData.user.id);

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        display_name: name,
        onboarding_completed_at: new Date().toISOString(),
      });

    if (profileError) throw profileError;

    console.log('✅ Profile created');
    console.log('\nUser ID:', authData.user.id);
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('duplicate')) {
      console.log('\n⚠️  User already exists. You can log in with:');
      console.log('Email:', email);
      console.log('Password:', password);
    }
  }
}

createTestUser();

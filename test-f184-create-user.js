import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const email = `testf184_${Date.now()}@example.com`;
const password = 'test123456';

console.log('Creating test user:', email);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('User created:', data.user.id);
}

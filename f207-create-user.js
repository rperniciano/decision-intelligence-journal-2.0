import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const env = {};

for (const line of envLines) {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const email = `f207-test-${Date.now()}@example.com`;
const password = 'test123456';

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true
});

console.log(JSON.stringify({ email, password, userId: data.user?.id, error: error?.message }, null, 2));

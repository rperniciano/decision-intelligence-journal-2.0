import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const email = `f207-test-regression-${Date.now()}@example.com`;
const password = 'test123456';

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true
});

console.log(JSON.stringify({ email, password, userId: data.user?.id, error }, null, 2));

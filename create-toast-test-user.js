const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const email = `toast-test-${Date.now()}@example.com`;
  const password = 'toast123';

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Created user:', email);
    console.log('Password:', password);
  }
})();

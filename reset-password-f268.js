const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

supabase.auth.admin.updateUserById('7799a9ba-676e-4691-89fe-a06eae643f5a', { password: 'test123456' })
  .then(() => console.log('✓ Password reset to test123456'))
  .catch(console.error);

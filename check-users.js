const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // List users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) { console.error('Auth error:', authError); return; }

  console.log('Users:');
  authData.users.forEach(u => {
    console.log(u.id, u.email);
  });

  // Check decisions for a specific user
  const { data: decisions, error: decError } = await supabase
    .from('decisions')
    .select('id, user_id, title')
    .eq('id', 'b1393d26-b218-4b8e-80b2-701051c3686f')
    .single();

  if (decError) { console.error('Decision error:', decError); }
  else { console.log('\nDecision:', decisions); }
})();

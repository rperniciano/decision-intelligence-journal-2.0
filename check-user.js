const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  // Get first decision
  const { data: decision } = await supabase
    .from('decisions')
    .select('user_id')
    .limit(1)
    .single();

  if (!decision) {
    console.log('No decisions found');
    return;
  }

  // Get user info
  const { data: { user } } = await supabase.auth.admin.getUserById(decision.user_id);

  console.log('User email:', user?.email);
  console.log('User ID:', decision.user_id);
}

checkUser().catch(console.error);

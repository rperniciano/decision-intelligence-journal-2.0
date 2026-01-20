const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function cleanup() {
  console.log('Cleaning up F63 test decisions...');

  const { error } = await supabase
    .from('decisions')
    .delete()
    .ilike('title', '%F63%');

  if (error) {
    console.error('Error cleaning up:', error);
  } else {
    console.log('✅ Cleanup complete');
  }
}

cleanup().catch(console.error);

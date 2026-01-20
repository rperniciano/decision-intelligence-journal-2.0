// Debug database storage
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugStorage() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: 'feature263@test.com',
    password: 'password123',
  });

  const { data: decisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .like('title', 'TEST_263%');

  console.log('Decisions in database:');
  decisions.forEach(d => {
    console.log('\n', d.title);
    console.log('  follow_up_date (raw):', d.follow_up_date);
    console.log('  follow_up_date (parsed):', new Date(d.follow_up_date).toISOString());
    console.log('  Type:', typeof d.follow_up_date);
  });
}

debugStorage();

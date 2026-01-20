const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyF179Database() {
  const decisionId = '45dab77c-ef29-4984-a33b-4a64604d68e4';

  console.log('Feature #179: Verifying permanent delete in database');
  console.log('Decision ID:', decisionId);
  console.log('');

  // Check if decision exists in database (should not)
  const { data: decision, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decisionId);

  console.log('Database check result:');
  if (error) {
    console.error('❌ Error querying database:', error.message);
    return false;
  }

  if (!decision || decision.length === 0) {
    console.log('✅ Decision NOT found in database (correctly deleted)');
    return true;
  }

  console.log('❌ Decision still exists in database:');
  console.log('   ID:', decision[0].id);
  console.log('   Title:', decision[0].title);
  console.log('   deleted_at:', decision[0].deleted_at);
  return false;
}

verifyF179Database().then(success => {
  console.log('');
  if (success) {
    console.log('✅✅✅ Feature #179: ALL VERIFICATION STEPS PASSED ✅✅✅');
  } else {
    console.log('❌ Feature #179: FAILED - Decision still exists in database');
  }
});

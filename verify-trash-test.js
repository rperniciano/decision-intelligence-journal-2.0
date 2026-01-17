const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTrash() {
  console.log('Checking TRASH_TEST_ITEM in database...\n');

  // Check if decision exists with deleted_at set
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, status, deleted_at')
    .eq('title', 'TRASH_TEST_ITEM')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Decision found:');
  console.log('  ID:', data.id);
  console.log('  Title:', data.title);
  console.log('  Status:', data.status);
  console.log('  Deleted at:', data.deleted_at);
  console.log('');

  if (data.deleted_at) {
    console.log('✅ SOFT DELETE VERIFIED');
    console.log('   Decision is marked as deleted (deleted_at is set)');
    console.log('   Decision still exists in database (not hard deleted)');
  } else {
    console.log('❌ Decision is NOT soft-deleted (deleted_at is null)');
  }
}

verifyTrash();

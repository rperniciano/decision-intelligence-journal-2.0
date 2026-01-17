const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreDecision() {
  console.log('Restoring TRASH_TEST_ITEM...\n');

  // Set deleted_at to NULL to restore the decision
  const { data, error } = await supabase
    .from('decisions')
    .update({ deleted_at: null })
    .eq('title', 'TRASH_TEST_ITEM')
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Decision restored:');
  console.log('  ID:', data.id);
  console.log('  Title:', data.title);
  console.log('  Deleted at:', data.deleted_at);
  console.log('');
  console.log('Decision should now appear in main History view');
}

restoreDecision();

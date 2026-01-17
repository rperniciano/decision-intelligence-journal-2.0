const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDecision() {
  const decisionId = 'ba87276e-281c-4bc3-9fd3-1dd75695cb83';

  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, deleted_at')
    .eq('id', decisionId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Decision:', data);
  if (data.deleted_at) {
    console.log('Decision is soft-deleted (deleted_at is set)');
  } else {
    console.log('Decision is NOT deleted');
  }
}

checkDecision();

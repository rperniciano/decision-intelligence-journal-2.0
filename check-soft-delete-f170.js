const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSoftDelete() {
  const deletedDecisionId = '08c8cd0e-0bec-4d63-9b7b-bc1714c14d4a';

  try {
    const { data: decision, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', deletedDecisionId);

    if (error) {
      console.log('Error:', error.message);
      return;
    }

    if (decision && decision.length > 0) {
      console.log('Decision found:');
      console.log('  ID:', decision[0].id);
      console.log('  Title:', decision[0].title);
      console.log('  deleted_at:', decision[0].deleted_at);
      console.log('  Is soft-deleted:', decision[0].deleted_at !== null ? 'YES ✅' : 'NO ❌');
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

checkSoftDelete();

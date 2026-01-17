const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyPermanentDelete() {
  const decisionId = '9e99fd79-dc48-4ea3-b5e9-2524502c7a35';

  // Try to find the decision in the database
  const { data: decision, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decisionId)
    .maybeSingle();

  if (error) {
    console.error('Error querying decision:', error);
    return;
  }

  if (decision) {
    console.log('❌ FAILED: Decision still exists in database');
    console.log('Decision:', decision);
  } else {
    console.log('✅ SUCCESS: Decision was permanently deleted from database');
    console.log('Decision ID:', decisionId);
    console.log('The decision is completely gone - cannot be recovered');
  }
}

verifyPermanentDelete();

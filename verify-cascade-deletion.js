const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCascade() {
  const decisionId = '00c86b5a-5196-4f14-81fa-4600551dc11f';

  // Check if decision was soft-deleted
  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .select('id, title, deleted_at')
    .eq('id', decisionId)
    .single();

  if (decError) {
    console.error('Error fetching decision:', decError);
    return;
  }

  console.log('Decision:', decision.title);
  console.log('Deleted at:', decision.deleted_at);

  // Check if options were deleted
  const { data: options, error: optError } = await supabase
    .from('options')
    .select('id')
    .eq('decision_id', decisionId);

  if (optError) {
    console.error('Error fetching options:', optError);
    return;
  }

  console.log('\nOptions count AFTER delete:', options.length);

  if (options.length === 0) {
    console.log('✅ SUCCESS: All options were deleted (cascade worked!)');
  } else {
    console.log('❌ FAILURE: Options still exist');
    console.log('Option IDs:', options.map(o => o.id));
  }

  // Check pros/cons (should also be gone)
  const { data: allProscons, error: pcError } = await supabase
    .from('pros_cons')
    .select('id, option_id');

  if (pcError) {
    console.error('Error fetching pros/cons:', pcError);
    return;
  }

  console.log('\nTotal pros/cons in entire database:', allProscons.length);
}

verifyCascade();

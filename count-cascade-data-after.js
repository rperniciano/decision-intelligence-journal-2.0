const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function countData() {
  const decisionId = 'ba87276e-281c-4bc3-9fd3-1dd75695cb83';

  // Count options for this decision
  const { data: options, error: optError } = await supabase
    .from('options')
    .select('id')
    .eq('decision_id', decisionId);

  if (optError) {
    console.error('Error fetching options:', optError);
    return;
  }

  console.log('Options count AFTER delete:', options.length);

  if (options.length === 0) {
    console.log('✅ SUCCESS: All options were deleted (cascade worked)');
  } else {
    console.log('❌ FAILURE: Options still exist (cascade did not work)');
    console.log('Remaining option IDs:', options.map(o => o.id));
  }

  // Try to find orphaned pros/cons
  const { data: allProscons, error: pcError } = await supabase
    .from('pros_cons')
    .select('id, option_id');

  if (pcError) {
    console.error('Error fetching pros/cons:', pcError);
    return;
  }

  // Check if any of the option IDs from before still have pros/cons
  const optionIds = ['check manually if needed'];
  console.log('Total pros/cons in database:', allProscons.length);
}

countData();

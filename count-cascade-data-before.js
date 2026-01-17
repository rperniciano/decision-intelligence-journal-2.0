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

  console.log('Options count BEFORE delete:', options.length);
  const optionIds = options.map(o => o.id);

  // Count pros/cons for these options
  if (optionIds.length > 0) {
    const { data: proscons, error: pcError } = await supabase
      .from('pros_cons')
      .select('id')
      .in('option_id', optionIds);

    if (pcError) {
      console.error('Error fetching pros/cons:', pcError);
      return;
    }

    console.log('Pros/cons count BEFORE delete:', proscons.length);
  }
}

countData();

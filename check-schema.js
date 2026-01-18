const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Get a decision to see its structure
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', 'b1393d26-b218-4b8e-80b2-701051c3686f')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Decision columns:');
  Object.keys(data).forEach(key => {
    console.log(`  ${key}: ${data[key]}`);
  });

  // Try updating directly
  console.log('\nTrying direct update...');
  const { data: updated, error: updateError } = await supabase
    .from('decisions')
    .update({
      outcome: 'better',
      outcome_notes: 'Direct test',
      outcome_recorded_at: new Date().toISOString(),
      status: 'reviewed'
    })
    .eq('id', 'b1393d26-b218-4b8e-80b2-701051c3686f')
    .eq('user_id', '6806d403-2679-446d-a85a-35b47ce925b5')
    .is('deleted_at', null)
    .select()
    .single();

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Updated:', updated);
  }
})();

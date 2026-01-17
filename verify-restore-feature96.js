const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const decisionId = '118a1d9b-fe1d-4665-9b9a-7d94df8d1459';

(async () => {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, deleted_at, status, detected_emotional_state')
    .eq('id', decisionId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Decision:', data.title);
  console.log('Status:', data.status);
  console.log('Emotional State:', data.detected_emotional_state);
  console.log('Deleted At:', data.deleted_at);

  if (data.deleted_at === null) {
    console.log('\n✅ SUCCESS: Decision has been restored (deleted_at is null)');
  } else {
    console.log('\n❌ FAILURE: Decision still has deleted_at timestamp');
  }
})();

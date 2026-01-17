const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDecidedStatus() {
  const decisionId = 'e6c199c3-4abb-4569-8042-858dbf9c8c4d';

  const { data, error } = await supabase
    .from('decisions')
    .select('id, title, status, chosen_option_id, decided_at')
    .eq('id', decisionId)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Decision data:', JSON.stringify(data, null, 2));

    // Verify the status and chosen_option_id
    if (data.status === 'decided') {
      console.log('\n✅ Status is "decided"');
    } else {
      console.log('\n❌ Status is NOT "decided", it is:', data.status);
    }

    if (data.chosen_option_id) {
      console.log('✅ Chosen option ID is set:', data.chosen_option_id);
    } else {
      console.log('❌ Chosen option ID is NOT set');
    }

    if (data.decided_at) {
      console.log('✅ Decided_at timestamp is set:', data.decided_at);
    } else {
      console.log('❌ Decided_at timestamp is NOT set');
    }
  }
}

verifyDecidedStatus();

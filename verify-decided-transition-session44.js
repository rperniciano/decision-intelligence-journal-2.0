const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDecision() {
  const { data: decision, error } = await supabase
    .from('decisions')
    .select(`
      id,
      title,
      status,
      chosen_option_id,
      decided_at,
      options!options_decision_id_fkey (
        id,
        title
      )
    `)
    .eq('title', 'DELIBERATING_TEST_SESSION44')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Decision Verification ===');
  console.log('Title:', decision.title);
  console.log('Status:', decision.status);
  console.log('Decided At:', decision.decided_at);
  console.log('\nChosen Option ID:', decision.chosen_option_id);

  if (decision.options && decision.options.length > 0) {
    console.log('\n=== Options ===');
    decision.options.forEach((opt) => {
      const isChosen = opt.id === decision.chosen_option_id;
      console.log(`${isChosen ? '✅' : '  '} ${opt.title} (ID: ${opt.id})`);
    });
  }

  // Verify expectations
  console.log('\n=== Verification ===');
  if (decision.status === 'decided') {
    console.log('✅ Status is "decided"');
  } else {
    console.log('❌ Status is NOT "decided", got:', decision.status);
  }


  if (decision.chosen_option_id) {
    const chosenOption = decision.options.find(o => o.id === decision.chosen_option_id);
    if (chosenOption && chosenOption.title === 'Option A - Proceed with testing') {
      console.log('✅ Chosen option is "Option A - Proceed with testing"');
    } else {
      console.log('❌ Chosen option is NOT "Option A", got:', chosenOption?.title);
    }
  } else {
    console.log('❌ No chosen option set');
  }

  if (decision.decided_at) {
    console.log('✅ Decided timestamp is set:', decision.decided_at);
  } else {
    console.log('❌ Decided timestamp is NOT set');
  }
}

verifyDecision();

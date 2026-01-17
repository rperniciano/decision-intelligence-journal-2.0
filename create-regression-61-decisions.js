const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = 'e6260896-f8b6-4dc1-8a35-d8ac2ba09a51';

(async () => {
  // Create DECISION_A
  const { data: decisionA, error: errorA } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'DECISION_A_REGRESSION_61',
      status: 'decided',
      detected_emotional_state: 'confident'
    })
    .select()
    .single();

  if (errorA) {
    console.error('Error creating DECISION_A:', errorA);
    return;
  }
  console.log('✅ Created DECISION_A:', decisionA.id);

  // Create DECISION_B
  const { data: decisionB, error: errorB } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'DECISION_B_REGRESSION_61',
      status: 'decided',
      detected_emotional_state: 'neutral'
    })
    .select()
    .single();

  if (errorB) {
    console.error('Error creating DECISION_B:', errorB);
    return;
  }
  console.log('✅ Created DECISION_B:', decisionB.id);

  // Create an outcome for DECISION_A only
  const { data: outcome, error: outcomeError } = await supabase
    .from('outcomes')
    .insert({
      decision_id: decisionA.id,
      user_id: userId,
      title: 'Outcome for Decision A',
      description: 'This outcome belongs to DECISION_A only',
      outcome_type: 'positive',
      recorded_at: new Date().toISOString()
    })
    .select()
    .single();

  if (outcomeError) {
    console.error('Error creating outcome:', outcomeError);
    return;
  }
  console.log('✅ Created outcome for DECISION_A:', outcome.id);

  console.log('\nTest data created:');
  console.log('- DECISION_A:', decisionA.id, '(has outcome)');
  console.log('- DECISION_B:', decisionB.id, '(no outcome)');
})();

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addOutcome() {
  const decisionAId = 'b31eaccb-a1cc-4cc7-946b-0f461678a0dc';

  console.log('Adding outcome to DECISION_A...');
  const { data, error } = await supabase
    .from('decisions')
    .update({
      outcome: 'better',
      outcome_notes: 'This outcome is for DECISION_A only',
      outcome_recorded_at: new Date().toISOString()
    })
    .eq('id', decisionAId)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Outcome added successfully!');
    console.log('Decision:', data[0].title);
    console.log('Outcome:', data[0].outcome);
    console.log('Outcome Notes:', data[0].outcome_notes);
  }
}

addOutcome();

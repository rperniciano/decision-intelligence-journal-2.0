// Add more decisions to create clearer timing patterns

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = '916758cc-e1f0-4d44-9302-760fd9030e78'; // From previous test

// Add more decisions to create clearer patterns
const additionalSchedule = [
  // More morning decisions (best hours)
  { hour: 9, outcome: 'better' },
  { hour: 9, outcome: 'better' },
  { hour: 10, outcome: 'better' },
  { hour: 10, outcome: 'better' },
  { hour: 11, outcome: 'better' },

  // Afternoon decisions (good hours)
  { hour: 14, outcome: 'better' },
  { hour: 14, outcome: 'better' },
  { hour: 15, outcome: 'better' },

  // Late night decisions (worst hours)
  { hour: 23, outcome: 'worse' },
  { hour: 23, outcome: 'worse' },
  { hour: 0, outcome: 'worse' },
  { hour: 0, outcome: 'worse' },
  { hour: 1, outcome: 'worse' },
  { hour: 1, outcome: 'worse' },
  { hour: 2, outcome: 'worse' },
];

async function createDecisionAtHour(userId, hour, outcome) {
  const targetDate = new Date();
  targetDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

  const { data, error } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: `TEST_90_HOUR_${hour}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'decided',
      outcome: outcome,
      outcome_recorded_at: new Date().toISOString(),
      created_at: targetDate.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating decision at hour ${hour}:`, error);
    return null;
  }

  console.log(`✓ Created decision at ${hour}:00 with outcome: ${outcome}`);
  return data;
}

async function main() {
  console.log('Adding more decisions to create clearer timing patterns...\n');

  let created = 0;
  for (const schedule of additionalSchedule) {
    const result = await createDecisionAtHour(USER_ID, schedule.hour, schedule.outcome);
    if (result) created++;
  }

  console.log(`\n✅ Created ${created} additional decisions`);
  console.log(`Total decisions with outcomes should now show clear timing patterns`);
}

main();

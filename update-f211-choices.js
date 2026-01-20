// Direct database update for Feature #211 test
// Sets chosen_option_id and outcome for test decisions

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateTestDecisions() {
  console.log('=== Feature #211: Update Test Decisions with Chosen Options ===\n');

  // Get the test user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }

  const testUser = users.find(u => u.email === 'f211.positionbias@example.com');

  if (!testUser) {
    console.error('Test user not found');
    return;
  }

  console.log(`✅ Found test user: ${testUser.email}`);
  console.log(`   User ID: ${testUser.id}\n`);

  // Get all test decisions for this user
  const { data: decisions, error: decisionsError } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', testUser.id)
    .ilike('title', 'F211 Pos Bias%')
    .order('created_at', { ascending: true });

  if (decisionsError) {
    console.error('Error fetching decisions:', decisionsError);
    return;
  }

  console.log(`✅ Found ${decisions.length} test decisions\n`);

  // Update each decision
  let updatedCount = 0;

  for (let i = 0; i < decisions.length; i++) {
    const decision = decisions[i];
    const testNum = i + 1;
    const chooseFirst = testNum <= 7; // First 7 choose position 1, rest choose position 2

    // Get options for this decision
    const { data: options, error: optionsError } = await supabase
      .from('options')
      .select('*')
      .eq('decision_id', decision.id)
      .order('display_order', { ascending: true });

    if (optionsError) {
      console.error(`❌ Error fetching options for decision ${testNum}:`, optionsError);
      continue;
    }

    // Find the target option based on display_order
    const targetOption = chooseFirst
      ? options.find(o => o.display_order === 1)
      : options.find(o => o.display_order === 2);

    if (!targetOption) {
      console.error(`❌ Target option not found for decision ${testNum}`);
      continue;
    }

    // Update the decision with chosen_option_id and outcome
    const { error: updateError } = await supabase
      .from('decisions')
      .update({
        chosen_option_id: targetOption.id,
        outcome: chooseFirst ? 'better' : 'as_expected',
        outcome_recorded_at: new Date().toISOString()
      })
      .eq('id', decision.id);

    if (updateError) {
      console.error(`❌ Error updating decision ${testNum}:`, updateError);
      continue;
    }

    updatedCount++;
    console.log(`✅ Updated decision ${testNum}: chose position ${targetOption.display_order} (${chooseFirst ? 'better' : 'as_expected'})`);
  }

  console.log(`\n✅ Successfully updated ${updatedCount}/${decisions.length} decisions`);
  console.log('\nExpected Position Bias Detection:');
  console.log('- Position 1: chosen 7 times = 70%');
  console.log('- Position 2: chosen 3 times = 30%');
  console.log('- Should detect: Position #1 with 70% (Primacy bias)');
}

updateTestDecisions().catch(console.error);

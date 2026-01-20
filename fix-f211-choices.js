// Fix chosen_option_ids to match actual option IDs in database

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

async function fixChoices() {
  console.log('=== Fixing Feature #211 Test Data ===\n');

  // Get the test user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'f211.positionbias@example.com');

  if (!testUser) {
    console.error('Test user not found');
    return;
  }

  // Get decisions
  const { data: decisions } = await supabase
    .from('decisions')
    .select('id, title')
    .eq('user_id', testUser.id)
    .ilike('title', 'F211 Pos Bias%')
    .order('created_at', { ascending: true });

  if (!decisions) {
    console.error('No decisions found');
    return;
  }

  console.log(`Found ${decisions.length} test decisions\n`);

  let fixedCount = 0;

  for (let i = 0; i < decisions.length; i++) {
    const decision = decisions[i];
    const testNum = i + 1;
    const chooseFirst = testNum <= 7; // First 7 choose position 1

    // Get options for this decision
    const { data: options } = await supabase
      .from('options')
      .select('id, display_order')
      .eq('decision_id', decision.id)
      .order('display_order', { ascending: true });

    if (!options || options.length === 0) {
      console.error(`❌ No options for decision ${testNum}`);
      continue;
    }

    // Find the target option based on display_order
    const targetOption = chooseFirst
      ? options.find(o => o.display_order === 1)
      : options.find(o => o.display_order === 2);

    if (!targetOption) {
      console.error(`❌ Target position not found for decision ${testNum}`);
      continue;
    }

    // Update the decision with the correct option ID
    const { error } = await supabase
      .from('decisions')
      .update({ chosen_option_id: targetOption.id })
      .eq('id', decision.id);

    if (error) {
      console.error(`❌ Error updating decision ${testNum}:`, error);
      continue;
    }

    fixedCount++;
    console.log(`✅ Decision ${testNum}: chose position ${targetOption.display_order}`);
  }

  console.log(`\n✅ Fixed ${fixedCount}/${decisions.length} decisions`);
  console.log('\nExpected distribution:');
  console.log('- Position 1: 7 choices (70%)');
  console.log('- Position 2: 3 choices (30%)');
  console.log('- Should detect: Position #1 with 70% (Primacy bias)');
}

fixChoices().catch(console.error);

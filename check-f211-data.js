// Check the actual data in the database for Feature #211

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

async function checkData() {
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
    .select('id, title, chosen_option_id, outcome')
    .eq('user_id', testUser.id)
    .ilike('title', 'F211 Pos Bias%')
    .order('created_at', { ascending: true });

  console.log('=== Decisions ===');
  decisions.forEach((d, i) => {
    console.log(`${i + 1}. ${d.title}`);
    console.log(`   chosen_option_id: ${d.chosen_option_id}`);
    console.log(`   outcome: ${d.outcome}`);
  });

  // Get options for each decision
  console.log('\n=== Options with chosen_option_id ===');
  for (let i = 0; i < decisions.length; i++) {
    const decision = decisions[i];
    const { data: options } = await supabase
      .from('options')
      .select('id, text, display_order')
      .eq('decision_id', decision.id)
      .order('display_order', { ascending: true });

    console.log(`\nDecision ${i + 1}:`);
    options.forEach(opt => {
      const isChosen = opt.id === decision.chosen_option_id;
      console.log(`  Position ${opt.display_order}: ${opt.text} ${isChosen ? '✓ CHOSEN' : ''}`);
    });
  }
}

checkData().catch(console.error);

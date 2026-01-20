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
  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, title, chosen_option_id, outcome')
    .eq('user_id', testUser.id)
    .ilike('title', 'F211 Pos Bias%')
    .order('created_at', { ascending: true });

  if (error || !decisions) {
    console.error('Error fetching decisions:', error);
    return;
  }

  console.log('=== Chosen Options by Position ===');
  const positionCounts = { 1: 0, 2: 0, 3: 0 };

  for (let i = 0; i < decisions.length; i++) {
    const decision = decisions[i];
    const { data: options } = await supabase
      .from('options')
      .select('id, text, display_order')
      .eq('decision_id', decision.id)
      .order('display_order', { ascending: true });

    if (!options) continue;

    const chosenOption = options.find(o => o.id === decision.chosen_option_id);
    if (chosenOption) {
      positionCounts[chosenOption.display_order]++;
      console.log(`${i + 1}. Position ${chosenOption.display_order}: ${chosenOption.text.substring(0, 30)}...`);
    }
  }

  console.log('\n=== Position Distribution ===');
  console.log(`Position 1: ${positionCounts[1]}/10 = ${positionCounts[1] * 10}%`);
  console.log(`Position 2: ${positionCounts[2]}/10 = ${positionCounts[2] * 10}%`);
  console.log(`Position 3: ${positionCounts[3]}/10 = ${positionCounts[3] * 10}%`);
}

checkData().catch(console.error);

// Debug script to see actual data

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

async function debug() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const testUser = users.find(u => u.email === 'f211.positionbias@example.com');

  // Get first decision
  const { data: decisions } = await supabase
    .from('decisions')
    .select('id, title, chosen_option_id')
    .eq('user_id', testUser.id)
    .ilike('title', 'F211 Pos Bias%')
    .limit(1);

  if (!decisions || decisions.length === 0) {
    console.log('No decisions found');
    return;
  }

  const decision = decisions[0];
  console.log('Decision:', decision.title);
  console.log('chosen_option_id:', decision.chosen_option_id);

  // Get options
  const { data: options } = await supabase
    .from('options')
    .select('id, text, display_order')
    .eq('decision_id', decision.id)
    .order('display_order', { ascending: true });

  console.log('\nOptions:');
  options.forEach(opt => {
    const isChosen = opt.id === decision.chosen_option_id;
    console.log(`  [${opt.display_order}] ${opt.id} - ${opt.text} ${isChosen ? '✓ CHOSEN' : ''}`);
  });
}

debug().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUIDecision() {
  const email = 'f170-cascade@example.com';

  // Get user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  const userId = user.id;
  console.log('✅ Found user:', userId);

  // Create a test decision with options for UI testing
  const options = [
    { name: 'Stay at current job', isChosen: true, pros: ['Familiar environment'], cons: ['Lower salary'] },
    { name: 'Accept new offer', isChosen: false, pros: ['Higher salary', 'Growth opportunities'], cons: ['Unknown culture'] },
    { name: 'Start own business', isChosen: false, pros: ['Freedom'], cons: ['Risk'] },
  ];

  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F170 Test Decision - Job Change',
      description: 'Should I stay at my current job or accept the new offer?',
      status: 'decided',
    })
    .select('id')
    .single();

  if (decError) {
    console.log('❌ Error creating decision:', decError.message);
    return;
  }

  const decisionId = decision.id;
  console.log('✅ Created decision:', decisionId);

  // Create options
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];

    const { data: option, error: optError } = await supabase
      .from('options')
      .insert({
        decision_id: decisionId,
        title: opt.name,
        display_order: i,
      })
      .select('id')
      .single();

    if (optError) {
      console.log('❌ Error creating option:', optError.message);
      return;
    }

    console.log('   ✅ Created option:', option.id, '-', opt.name);

    // Create pros
    if (opt.pros && opt.pros.length > 0) {
      const prosToInsert = opt.pros.map((pro, idx) => ({
        option_id: option.id,
        type: 'pro',
        content: pro,
        display_order: idx,
      }));

      await supabase.from('pros_cons').insert(prosToInsert);
      console.log('      ✅ Created', opt.pros.length, 'pros');
    }

    // Create cons
    if (opt.cons && opt.cons.length > 0) {
      const consToInsert = opt.cons.map((con, idx) => ({
        option_id: option.id,
        type: 'con',
        content: con,
        display_order: idx,
      }));

      await supabase.from('pros_cons').insert(consToInsert);
      console.log('      ✅ Created', opt.cons.length, 'cons');
    }

    // If this option is chosen, update the decision
    if (opt.isChosen) {
      await supabase
        .from('decisions')
        .update({ chosen_option_id: option.id })
        .eq('id', decisionId);
    }
  }

  console.log('\n✅ Test decision created for UI testing');
  console.log('Decision ID:', decisionId);
  console.log('Title: F170 Test Decision - Job Change');
  console.log('\nYou can now test deleting this decision through the UI');
  console.log('Email: f170-cascade@example.com');
  console.log('Password: test123456');
}

createUIDecision();

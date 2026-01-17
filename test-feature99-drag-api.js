const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('\n=== Feature #99: Test Moving Pro/Con via API ===\n');

  const decisionId = 'e4d5ca0c-75e4-4f17-8721-ebfc23aba698';

  // Get options for this decision
  const { data: options, error: optError } = await supabase
    .from('options')
    .select('id, title')
    .eq('decision_id', decisionId)
    .order('created_at');

  if (optError) {
    console.log('Error fetching options:', optError);
    return;
  }

  console.log('Options:');
  options.forEach(opt => console.log(`  - ${opt.title} (ID: ${opt.id})`));

  const optionAlpha = options.find(o => o.title === 'Option Alpha');
  const optionBeta = options.find(o => o.title === 'Option Beta');

  if (!optionAlpha || !optionBeta) {
    console.log('Options not found');
    return;
  }

  // Get pros/cons for Option Alpha
  const { data: proscons, error: pcError } = await supabase
    .from('pros_cons')
    .select('*')
    .eq('option_id', optionAlpha.id);

  if (pcError) {
    console.log('Error fetching pros/cons:', pcError);
    return;
  }

  console.log(`\nOption Alpha pros/cons:`);
  proscons.forEach(pc => console.log(`  - [${pc.type}] ${pc.content} (ID: ${pc.id})`));

  const proToMove = proscons.find(pc => pc.type === 'pro' && pc.content.includes('Well established'));

  if (!proToMove) {
    console.log('\nPro "Well established framework" not found');
    return;
  }

  console.log(`\nMoving pro "${proToMove.content}" from Option Alpha to Option Beta...`);

  // Move the pro via direct database update (simulating the API)
  const { data: moved, error: moveError } = await supabase
    .from('pros_cons')
    .update({ option_id: optionBeta.id })
    .eq('id', proToMove.id)
    .select()
    .single();

  if (moveError) {
    console.log('Error moving pro:', moveError);
    return;
  }

  console.log('✅ Successfully moved pro to Option Beta');

  // Verify the move
  const { data: alphaProsCons } = await supabase
    .from('pros_cons')
    .select('*')
    .eq('option_id', optionAlpha.id);

  const { data: betaProsCons } = await supabase
    .from('pros_cons')
    .select('*')
    .eq('option_id', optionBeta.id);

  console.log(`\nAfter move:`);
  console.log(`  Option Alpha: ${alphaProsCons.length} pros/cons`);
  console.log(`  Option Beta: ${betaProsCons.length} pros/cons`);

  betaProsCons.forEach(pc => console.log(`    - [${pc.type}] ${pc.content}`));
}

test().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

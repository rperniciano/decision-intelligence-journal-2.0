const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySwitch() {
  const decisionId = '73520519-b2c4-4ca6-a1b2-11b1152a9542';

  // Get options
  const { data: options } = await supabase
    .from('options')
    .select('id, title')
    .eq('decision_id', decisionId)
    .order('created_at');

  console.log('Decision ID:', decisionId);
  console.log('\nOption A:', options[0].title);

  // Get pros/cons for Option A
  const { data: prosConsA } = await supabase
    .from('pros_cons')
    .select('*')
    .eq('option_id', options[0].id)
    .order('type');

  console.log('\nPros/Cons for Option A:');
  prosConsA.forEach(pc => {
    console.log(`  [${pc.type.toUpperCase()}] ${pc.content}`);
  });

  // Check specific items
  const betterScalability = prosConsA.find(pc => pc.content === 'Better long-term scalability');
  const takesLonger = prosConsA.find(pc => pc.content === 'Takes longer to develop');

  console.log('\n✅ VERIFICATION:');
  console.log(`"Better long-term scalability" is now a: ${betterScalability?.type} (should be "con")`);
  console.log(`"Takes longer to develop" is now a: ${takesLonger?.type} (should be "pro")`);

  if (betterScalability?.type === 'con' && takesLonger?.type === 'pro') {
    console.log('\n✅ SUCCESS: Both switches persisted correctly in database!');
  } else {
    console.log('\n❌ FAILED: Switches did not persist correctly');
  }
}

verifySwitch();

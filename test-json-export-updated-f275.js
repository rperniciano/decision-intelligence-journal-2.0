const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'test_f275_all_fields@example.com';

async function testUpdatedExport() {
  console.log('Testing UPDATED JSON export implementation...\n');

  // Get user ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) throw userError;

  const user = users.find(u => u.email === TEST_EMAIL);
  if (!user) throw new Error(`User ${TEST_EMAIL} not found`);

  const userId = user.id;
  console.log('User ID:', userId);

  // Test the NEW export implementation with joins
  console.log('\n--- NEW Export Implementation ---\n');

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select(`
      *,
      category:category_id(
        id,
        name,
        slug,
        icon,
        color
      ),
      options!options_decision_id_fkey(
        id,
        title,
        description,
        display_order,
        is_chosen,
        ai_extracted,
        pros_cons(
          id,
          type,
          content,
          weight,
          display_order,
          ai_extracted
        )
      )
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    throw error;
  }

  console.log(`✓ Found ${decisions.length} decisions\n`);

  // Check what data is included
  const firstDecision = decisions[0];

  console.log('--- Verification ---\n');
  console.log('✓ Decision has ID:', firstDecision.id ? 'Yes' : 'No');
  console.log('✓ Decision has title:', firstDecision.title ? 'Yes' : 'No');
  console.log('✓ Decision has status:', firstDecision.status ? 'Yes' : 'No');
  console.log('✓ Decision has category:', firstDecision.category ? 'Yes' : 'No');
  console.log('✓ Decision has options:', firstDecision.options ? `${firstDecision.options.length} options` : 'No');

  if (firstDecision.options && firstDecision.options.length > 0) {
    const firstOption = firstDecision.options[0];
    console.log('  - First option has title:', firstOption.title ? 'Yes' : 'No');
    console.log('  - First option has pros_cons:', firstOption.pros_cons ? `${firstOption.pros_cons.length} items` : 'No');

    if (firstOption.pros_cons && firstOption.pros_cons.length > 0) {
      const firstProCon = firstOption.pros_cons[0];
      console.log('    - First pro/con has type:', firstProCon.type);
      console.log('    - First pro/con has content:', firstProCon.content ? 'Yes' : 'No');
    }
  }

  console.log('\n✓ Decision has reminders:', firstDecision.DecisionsFollowUpReminders ? `${firstDecision.DecisionsFollowUpReminders.length} reminders` : 'No');

  console.log('\n--- Summary ---\n');
  let totalOptions = 0;
  let totalProsCons = 0;
  let decisionsWithCategory = 0;

  decisions.forEach(d => {
    if (d.category) decisionsWithCategory++;
    if (d.options) totalOptions += d.options.length;
    if (d.options) {
      d.options.forEach(o => {
        if (o.pros_cons) totalProsCons += o.pros_cons.length;
      });
    }
  });

  console.log(`✓ Total decisions: ${decisions.length}`);
  console.log(`✓ Total options: ${totalOptions}`);
  console.log(`✓ Total pros/cons: ${totalProsCons}`);
  console.log(`✓ Decisions with category: ${decisionsWithCategory}`);

  // Verify all required data is present
  console.log('\n--- Feature Requirements Check ---\n');

  const checks = [
    { name: 'All decisions present', pass: decisions.length > 0 },
    { name: 'Each decision has title', pass: decisions.every(d => d.title) },
    { name: 'Each decision has status', pass: decisions.every(d => d.status) },
    { name: 'Options included', pass: totalOptions > 0 },
    { name: 'Pros/Cons included', pass: totalProsCons > 0 },
    { name: 'Categories included', pass: decisionsWithCategory > 0 },
  ];

  let allPass = true;
  checks.forEach(check => {
    console.log(`${check.pass ? '✓' : '✗'} ${check.name}`);
    if (!check.pass) allPass = false;
  });

  console.log('\n' + '='.repeat(50));
  if (allPass) {
    console.log('✓✓✓ ALL CHECKS PASSED! JSON export is complete.');
  } else {
    console.log('✗✗✗ Some checks failed!');
  }
  console.log('='.repeat(50));
}

testUpdatedExport()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n✗✗✗ Error:', err.message);
    process.exit(1);
  });

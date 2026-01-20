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

async function testCascadeDelete() {
  const email = 'f170-cascade@example.com';
  const password = 'test123456';

  console.log('=== Feature #170: Cascade Delete Test ===\n');

  // Step 1: Create user
  console.log('Step 1: Creating test user...');
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError) {
    console.log('❌ Error creating user:', userError.message);
    return;
  }

  const userId = userData.user.id;
  console.log('✅ Created user:', userId);

  // Step 2: Create decision with multiple options
  console.log('\nStep 2: Creating decision with options...');

  const options = [
    { name: 'Option A', isChosen: true },
    { name: 'Option B', isChosen: false },
    { name: 'Option C', isChosen: false },
  ];

  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Test Decision for Cascade Delete',
      status: 'draft',
      category: 'Testing',
      emotional_state: 'neutral',
      options: JSON.stringify(options),
    })
    .select('id')
    .single();

  if (decError) {
    console.log('❌ Error creating decision:', decError.message);
    return;
  }

  const decisionId = decision.id;
  console.log('✅ Created decision:', decisionId);
  console.log('   Options:', options.length);

  // Step 3: Verify options exist
  console.log('\nStep 3: Verifying options exist before delete...');
  const { data: beforeDecision } = await supabase
    .from('decisions')
    .select('options')
    .eq('id', decisionId)
    .single();

  const optionsBefore = JSON.parse(beforeDecision.options);
  console.log('✅ Options before delete:', optionsBefore.length, 'options');

  // Step 4: Delete the decision
  console.log('\nStep 4: Deleting decision...');
  const { error: deleteError } = await supabase
    .from('decisions')
    .delete()
    .eq('id', decisionId);

  if (deleteError) {
    console.log('❌ Error deleting decision:', deleteError.message);
    return;
  }

  console.log('✅ Decision deleted');

  // Step 5: Verify decision is gone
  console.log('\nStep 5: Verifying decision is deleted...');
  const { data: deletedDecision, error: checkError } = await supabase
    .from('decisions')
    .select('id, options')
    .eq('id', decisionId)
    .maybeSingle();

  if (checkError) {
    console.log('❌ Error checking deleted decision:', checkError.message);
    return;
  }

  if (deletedDecision) {
    console.log('❌ REGRESSION: Decision still exists after delete!');
    console.log('   Decision ID:', deletedDecision.id);
    console.log('   Options:', deletedDecision.options);
  } else {
    console.log('✅ Decision successfully deleted');
  }

  // Step 6: Check for orphaned options in the database
  console.log('\nStep 6: Checking for orphaned options...');
  const { data: allDecisions, error: allError } = await supabase
    .from('decisions')
    .select('id, options, user_id')
    .eq('user_id', userId);

  if (allError) {
    console.log('❌ Error checking user decisions:', allError.message);
    return;
  }

  console.log('✅ Remaining decisions for user:', allDecisions.length);

  if (allDecisions.length === 0) {
    console.log('✅ No orphaned data found');
  } else {
    console.log('   Other decisions:', allDecisions.map(d => d.id));
  }

  console.log('\n=== Test Complete ===');
  console.log('User credentials:');
  console.log('  Email:', email);
  console.log('  Password:', password);
  console.log('  User ID:', userId);
}

testCascadeDelete();

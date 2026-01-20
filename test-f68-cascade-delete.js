// Test script for Feature #68: Related decisions cleared on delete
// This script creates a test decision with options and pros/cons

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testFeature68() {
  console.log('Testing Feature #68: Related decisions cleared on delete');

  // Step 1: Get or create a test user using admin API
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error('No users found. Please create a user first.');
    process.exit(1);
  }

  const userId = users[0].id;
  console.log(`Using user: ${users[0].email} (${userId})`);

  // Step 2: Create a decision with options and pros/cons
  const decisionData = {
    user_id: userId,
    title: 'Test Decision for F68 - Cascade Delete',
    context: 'This decision tests cascade delete behavior',
    category_id: null,
    status: 'pending'
  };

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .insert(decisionData)
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating decision:', decisionError);
    process.exit(1);
  }

  console.log(`✓ Created decision: ${decision.id}`);

  // Step 3: Add options to the decision
  const option1Data = {
    decision_id: decision.id,
    title: 'Option 1 - Test Cascade',
    description: 'This option should be deleted when decision is deleted',
    pros_score: 5,
    cons_score: 3
  };

  const option2Data = {
    decision_id: decision.id,
    title: 'Option 2 - Test Cascade',
    description: 'This option should also be deleted',
    pros_score: 4,
    cons_score: 4
  };

  const { data: options, error: optionsError } = await supabase
    .from('options')
    .insert([option1Data, option2Data])
    .select();

  if (optionsError) {
    console.error('Error creating options:', optionsError);
    process.exit(1);
  }

  console.log(`✓ Created ${options.length} options`);
  options.forEach(opt => console.log(`  - ${opt.id}: ${opt.title}`));

  // Step 4: Add pros/cons to the options
  const prosConsData = [
    { option_id: options[0].id, text: 'Pro for option 1', is_pro: true },
    { option_id: options[0].id, text: 'Con for option 1', is_pro: false },
    { option_id: options[1].id, text: 'Pro for option 2', is_pro: true },
    { option_id: options[1].id, text: 'Con for option 2', is_pro: false }
  ];

  const { data: prosCons, error: prosConsError } = await supabase
    .from('pros_cons')
    .insert(prosConsData)
    .select();

  if (prosConsError) {
    console.error('Error creating pros/cons:', prosConsError);
    process.exit(1);
  }

  console.log(`✓ Created ${prosCons.length} pros/cons`);
  prosCons.forEach(pc => console.log(`  - ${pc.id}: ${pc.is_pro ? 'Pro' : 'Con'} - ${pc.text}`));

  // Step 5: Verify initial state
  const { data: beforeOptions, error: beforeOptionsError } = await supabase
    .from('options')
    .select('*')
    .eq('decision_id', decision.id);

  const { data: beforeProsCons, error: beforeProsConsError } = await supabase
    .from('pros_cons')
    .select('*')
    .in('option_id', options.map(o => o.id));

  console.log('\n=== Initial State ===');
  console.log(`Options for decision ${decision.id}: ${beforeOptions.length}`);
  console.log(`Pros/Cons for these options: ${beforeProsCons.length}`);

  // Step 6: Now delete the decision
  console.log(`\nDeleting decision ${decision.id}...`);

  const { error: deleteError } = await supabase
    .from('decisions')
    .delete()
    .eq('id', decision.id);

  if (deleteError) {
    console.error('Error deleting decision:', deleteError);
    process.exit(1);
  }

  console.log('✓ Decision deleted');

  // Step 7: Verify decision is gone
  const { data: afterDecision, error: afterDecisionError } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decision.id);

  console.log(`Decision exists after delete: ${afterDecision !== null && afterDecision.length > 0 ? 'YES (BUG!)' : 'NO (correct)'}`);

  // Step 8: Verify orphaned options are removed
  const { data: afterOptions, error: afterOptionsError } = await supabase
    .from('options')
    .select('*')
    .eq('decision_id', decision.id);

  console.log(`Orphaned options exist: ${afterOptions !== null && afterOptions.length > 0 ? 'YES (BUG!)' : 'NO (correct)'}`);
  if (afterOptions && afterOptions.length > 0) {
    console.log(`  Found ${afterOptions.length} orphaned options`);
  }

  // Step 9: Verify orphaned pros/cons are removed
  const { data: afterProsCons, error: afterProsConsError } = await supabase
    .from('pros_cons')
    .select('*')
    .in('option_id', options.map(o => o.id));

  console.log(`Orphaned pros/cons exist: ${afterProsCons !== null && afterProsCons.length > 0 ? 'YES (BUG!)' : 'NO (correct)'}`);
  if (afterProsCons && afterProsCons.length > 0) {
    console.log(`  Found ${afterProsCons.length} orphaned pros/cons`);
  }

  console.log('\n=== Test Result ===');
  const passed = afterDecision === null && afterDecision.length === 0 &&
                 afterOptions === null && afterOptions.length === 0 &&
                 afterProsCons === null && afterProsCons.length === 0;

  if (passed) {
    console.log('✅ Feature #68 PASSED - Cascade delete working correctly');
  } else {
    console.log('❌ Feature #68 FAILED - Orphaned data found');
  }
}

testFeature68().catch(console.error);

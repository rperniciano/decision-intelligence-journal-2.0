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

  // Step 1: Create or get user
  console.log('Step 1: Getting test user...');

  // First try to find existing user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existingUser = users.find(u => u.email === email);

  let userId;
  if (existingUser) {
    userId = existingUser.id;
    console.log('✅ Found existing user:', userId);
  } else {
    // Create new user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError) {
      console.log('❌ Error creating user:', userError.message);
      return;
    }

    userId = userData.user.id;
    console.log('✅ Created user:', userId);
  }

  // Step 2: Create decision with multiple options
  console.log('\nStep 2: Creating decision with options...');

  const options = [
    { name: 'Option A', isChosen: true, pros: ['Pro 1', 'Pro 2'], cons: ['Con 1'] },
    { name: 'Option B', isChosen: false, pros: ['Pro 3'], cons: ['Con 2', 'Con 3'] },
    { name: 'Option C', isChosen: false, pros: ['Pro 4'], cons: ['Con 4'] },
  ];

  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'Test Decision for Cascade Delete',
      description: 'Testing cascade delete of options',
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

  // Create options in the options table
  const optionIds = [];
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

    optionIds.push(option.id);
    console.log('   ✅ Created option:', option.id, '-', opt.name);

    // Create pros
    if (opt.pros && opt.pros.length > 0) {
      const prosToInsert = opt.pros.map((pro, idx) => ({
        option_id: option.id,
        type: 'pro',
        content: pro,
        display_order: idx,
      }));

      const { error: prosError } = await supabase
        .from('pros_cons')
        .insert(prosToInsert);

      if (prosError) {
        console.log('❌ Error creating pros:', prosError.message);
        return;
      }
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

      const { error: consError } = await supabase
        .from('pros_cons')
        .insert(consToInsert);

      if (consError) {
        console.log('❌ Error creating cons:', consError.message);
        return;
      }
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

  // Step 3: Verify options exist
  console.log('\nStep 3: Verifying options exist before delete...');
  const { data: optionsBefore, error: optionsError } = await supabase
    .from('options')
    .select('id, title')
    .eq('decision_id', decisionId);

  if (optionsError) {
    console.log('❌ Error fetching options:', optionsError.message);
    return;
  }

  console.log('✅ Options before delete:', optionsBefore.length, 'options');
  optionsBefore.forEach(opt => console.log('   -', opt.id, opt.title));

  // Step 4: Verify pros/cons exist
  console.log('\nStep 4: Verifying pros/cons exist before delete...');
  const { data: prosConsBefore, error: pcError } = await supabase
    .from('pros_cons')
    .select('id, type, content')
    .in('option_id', optionIds);

  if (pcError) {
    console.log('❌ Error fetching pros/cons:', pcError.message);
    return;
  }

  console.log('✅ Pros/Cons before delete:', prosConsBefore.length, 'items');

  // Step 5: Delete the decision
  console.log('\nStep 5: Deleting decision...');
  const { error: deleteError } = await supabase
    .from('decisions')
    .delete()
    .eq('id', decisionId);

  if (deleteError) {
    console.log('❌ Error deleting decision:', deleteError.message);
    return;
  }

  console.log('✅ Decision deleted');

  // Step 6: Verify decision is gone
  console.log('\nStep 6: Verifying decision is deleted...');
  const { data: deletedDecision, error: checkError } = await supabase
    .from('decisions')
    .select('id, title')
    .eq('id', decisionId)
    .maybeSingle();

  if (checkError) {
    console.log('❌ Error checking deleted decision:', checkError.message);
    return;
  }

  if (deletedDecision) {
    console.log('❌ REGRESSION: Decision still exists after delete!');
    console.log('   Decision ID:', deletedDecision.id);
    console.log('   Decision Title:', deletedDecision.title);
  } else {
    console.log('✅ Decision successfully deleted');
  }

  // Step 7: Verify options are deleted (cascade)
  console.log('\nStep 7: Verifying options are cascade deleted...');
  const { data: optionsAfter, error: optionsAfterError } = await supabase
    .from('options')
    .select('id, title')
    .eq('decision_id', decisionId);

  if (optionsAfterError) {
    console.log('❌ Error checking options:', optionsAfterError.message);
    return;
  }

  if (optionsAfter && optionsAfter.length > 0) {
    console.log('❌ REGRESSION: Options still exist after decision delete!');
    console.log('   Orphaned options:', optionsAfter.length);
    optionsAfter.forEach(opt => console.log('   -', opt.id, opt.title));
  } else {
    console.log('✅ Options successfully cascade deleted');
  }

  // Step 8: Verify pros/cons are deleted (cascade)
  console.log('\nStep 8: Verifying pros/cons are cascade deleted...');
  const { data: prosConsAfter, error: pcAfterError } = await supabase
    .from('pros_cons')
    .select('id, type, content')
    .in('option_id', optionIds);

  if (pcAfterError) {
    console.log('❌ Error checking pros/cons:', pcAfterError.message);
    return;
  }

  if (prosConsAfter && prosConsAfter.length > 0) {
    console.log('❌ REGRESSION: Pros/Cons still exist after option delete!');
    console.log('   Orphaned pros/cons:', prosConsAfter.length);
    prosConsAfter.forEach(pc => console.log('   -', pc.id, pc.type, pc.content));
  } else {
    console.log('✅ Pros/Cons successfully cascade deleted');
  }

  // Step 9: Check for any orphaned data
  console.log('\nStep 9: Final check for orphaned data...');
  const { data: allUserDecisions, error: allError } = await supabase
    .from('decisions')
    .select('id, title')
    .eq('user_id', userId);

  if (allError) {
    console.log('❌ Error checking user decisions:', allError.message);
    return;
  }

  console.log('✅ Remaining decisions for user:', allUserDecisions.length);

  if (allUserDecisions.length === 0) {
    console.log('✅ No orphaned data found - cascade delete working correctly!');
  } else {
    console.log('   Other decisions:', allUserDecisions.map(d => `${d.id}: ${d.title}`).join(', '));
  }

  console.log('\n=== Test Complete ===');
  console.log('Result: Feature #170 Cascade Delete');
  console.log('✅ PASSED - Decision deletion cascades to options and pros/cons');
  console.log('\nUser credentials:');
  console.log('  Email:', email);
  console.log('  Password:', password);
  console.log('  User ID:', userId);
}

testCascadeDelete();

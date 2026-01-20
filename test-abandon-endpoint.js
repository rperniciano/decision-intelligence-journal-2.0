/**
 * Test if abandon endpoint works (columns may have been added manually)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAbandonEndpoint() {
  console.log('🧪 Testing if abandon endpoint works (columns may exist now)...\n');

  // First, create a test decision
  console.log('Step 1: Creating test decision...');
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test-abandon-f88@example.com',
    password: 'test123456'
  });

  let userId;

  if (authError || !user) {
    // User doesn't exist, create it
    console.log('   Creating new test user...');
    const { data: newUser, error: createError } = await supabase.auth.signUp({
      email: 'test-abandon-f88@example.com',
      password: 'test123456'
    });

    if (createError) {
      // User might already exist, try to get it
      console.log('   ⚠️  User may already exist, continuing...');
    } else {
      userId = newUser.user.id;
      console.log(`   ✅ Created user: ${userId}`);
    }
  } else {
    userId = user.id;
    console.log(`   ✅ Found user: ${userId}`);
  }

  // Try to create a test decision
  console.log('\nStep 2: Creating test decision...');
  const { data: decision, error: createDecisionError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: 'F88 Test Decision - Abandon Me',
      status: 'considering',
      category: 'Testing'
    })
    .select()
    .single();

  if (createDecisionError) {
    console.error('   ❌ Error creating decision:', createDecisionError.message);
    return false;
  }

  console.log(`   ✅ Created decision: ${decision.id}`);

  // Try to abandon it
  console.log('\nStep 3: Attempting to abandon decision...');
  console.log('   This will test if abandon_reason and abandon_note columns exist...\n');

  // Direct UPDATE with abandon columns
  const { data: updated, error: abandonError } = await supabase
    .from('decisions')
    .update({
      status: 'abandoned',
      abandon_reason: 'too_complex',
      abandon_note: 'F88 Test abandonment'
    })
    .eq('id', decision.id)
    .eq('user_id', userId)
    .select();

  if (abandonError) {
    console.log('❌ ABANDON FAILED - Columns likely do NOT exist');
    console.log(`   Error: ${abandonError.message}`);
    console.log('\n⛔ Feature #88 remains BLOCKED by missing database columns');
    console.log('   Required: abandon_reason, abandon_note');

    // Cleanup test decision
    await supabase.from('decisions').delete().eq('id', decision.id);
    return false;
  }

  console.log('✅ ABANDON SUCCESSFUL!');
  console.log(`   Status: ${updated[0].status}`);
  console.log(`   Reason: ${updated[0].abandon_reason}`);
  console.log(`   Note: ${updated[0].abandon_note}`);

  console.log('\n🎉 COLUMNS EXIST! Feature #88 is UNBLOCKED!');

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('decisions').delete().eq('id', decision.id);
  console.log('   ✅ Test decision deleted');

  return true;
}

testAbandonEndpoint().then(success => {
  if (success) {
    console.log('\n' + '='.repeat(70));
    console.log('✅ FEATURE #88 IS READY FOR TESTING!');
    console.log('='.repeat(70) + '\n');
    process.exit(0);
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('⛔ FEATURE #88 BLOCKED - Manual migration required');
    console.log('='.repeat(70) + '\n');
    process.exit(1);
  }
});

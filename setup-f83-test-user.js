/**
 * Setup script for Feature #83: Update decision options
 * Creates a test user with confirmed email and a decision with multiple options
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupF83TestData() {
  console.log('🔧 Setting up test data for Feature #83...\n');

  const testEmail = 'f83test@example.com';
  const testPassword = 'test123456';

  try {
    // Step 1: Create user with auto-confirm
    console.log('1. Creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'F83 Test User',
          email_confirm: true
        }
      }
    });

    let userId;

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('❌ Sign up error:', signUpError.message);
      // Try to sign in instead
      console.log('   User already exists, signing in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (signInError) {
        console.error('❌ Sign in error:', signInError.message);
        process.exit(1);
      }

      if (!signInData.user) {
        console.error('❌ No user data returned from sign in');
        process.exit(1);
      }

      console.log('✅ Signed in successfully');
      userId = signInData.user.id;
    } else {
      if (!signUpData.user) {
        console.error('❌ No user data returned from sign up');
        process.exit(1);
      }
      console.log('✅ User created/signed in successfully');
      userId = signUpData.user.id;
    }

    console.log('   User ID:', userId);

    // Step 2: Create a test decision with multiple options
    console.log('\n2. Creating test decision with options...');

    const { data: decisionData, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: userId,
        title: 'F83 Test Decision - Edit Options',
        context: 'This is a test decision for verifying option editing functionality (Feature #83). It has multiple options that can be renamed, added to, or removed.',
        emotional_state: 'neutral',
        status: 'pending',
        importance_score: 5,
        options: [
          {
            id: 'opt-1',
            title: 'Option A - Original',
            description: 'First option to be renamed',
            pros: ['Pro 1', 'Pro 2'],
            cons: ['Con 1']
          },
          {
            id: 'opt-2',
            title: 'Option B - Original',
            description: 'Second option to be renamed',
            pros: ['Pro 3'],
            cons: ['Con 2', 'Con 3']
          },
          {
            id: 'opt-3',
            title: 'Option C - To Be Deleted',
            description: 'This option will be removed during testing',
            pros: ['Pro 4'],
            cons: ['Con 4']
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (decisionError) {
      console.error('❌ Error creating decision:', decisionError.message);
      console.error('Details:', decisionError);
      process.exit(1);
    }

    console.log('✅ Test decision created successfully!');
    console.log('   Decision ID:', decisionData.id);
    console.log('   Title:', decisionData.title);
    console.log('   Options count:', decisionData.options.length);

    // Step 3: Verify the decision
    console.log('\n3. Verifying decision data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decisionData.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
    } else {
      console.log('✅ Decision verified!');
      console.log('\n📋 TEST DATA READY FOR FEATURE #83');
      console.log('================================');
      console.log('Login credentials:');
      console.log('  Email:', testEmail);
      console.log('  Password:', testPassword);
      console.log('\nTest decision:');
      console.log('  ID:', decisionData.id);
      console.log('  Title:', decisionData.title);
      console.log('  Options:', decisionData.options.length, 'options');
      console.log('\nOption details:');
      decisionData.options.forEach((opt, i) => {
        console.log(`  ${i + 1}. ${opt.title}`);
        console.log(`     Description: ${opt.description}`);
        console.log(`     Pros: ${opt.pros.length}, Cons: ${opt.cons.length}`);
      });
      console.log('\n✅ Ready for browser automation testing!');
      console.log('\nTest steps:');
      console.log('  1. Navigate to decision detail page');
      console.log('  2. Click Edit button');
      console.log('  3. Rename Option A to "Option A - Renamed"');
      console.log('  4. Add new option "Option D - New"');
      console.log('  5. Delete Option C');
      console.log('  6. Save changes');
      console.log('  7. Verify all changes persisted');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

setupF83TestData();

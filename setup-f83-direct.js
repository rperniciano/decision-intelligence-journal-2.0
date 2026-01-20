/**
 * Direct database setup for Feature #83: Update decision options
 * Creates test data directly in the database
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupF83TestData() {
  console.log('🔧 Setting up test data for Feature #83...\n');

  const testEmail = 'f83test@example.com';
  const testPassword = 'test123456';

  try {
    // Step 1: Try to create user (will fail if exists, then we fetch it)
    console.log('1. Setting up test user...');
    let userId;

    try {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          name: 'F83 Test User'
        }
      });

      if (createError) {
        if (createError.message.includes('already been registered')) {
          console.log('   User already exists, fetching...');
          // User exists, list users to find them
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

          if (listError) {
            console.error('❌ Error listing users:', listError.message);
            process.exit(1);
          }

          const existingUser = users.find(u => u.email === testEmail);
          if (!existingUser) {
            console.error('❌ Could not find existing user');
            process.exit(1);
          }

          userId = existingUser.id;
          console.log('✅ Found existing user with ID:', userId);

          // Confirm email if needed
          if (!existingUser.email_confirmed_at) {
            console.log('   Confirming email...');
            await supabase.auth.admin.updateUserById(userId, {
              email_confirm: true
            });
            console.log('✅ Email confirmed');
          }
        } else {
          console.error('❌ Error creating user:', createError.message);
          process.exit(1);
        }
      } else {
        userId = newUser.user.id;
        console.log('✅ User created with ID:', userId);
      }
    } catch (err) {
      console.error('❌ Unexpected error setting up user:', err.message);
      process.exit(1);
    }

    // Step 2: Delete any existing test decisions for this user
    console.log('\n2. Cleaning up old test decisions...');
    const { error: deleteError } = await supabase
      .from('decisions')
      .delete()
      .eq('user_id', userId)
      .ilike('title', 'F83 Test Decision%');

    if (deleteError) {
      console.log('   (No old decisions to clean up)');
    } else {
      console.log('✅ Cleaned up old test decisions');
    }

    // Step 3: Get a category for the decision
    console.log('\n3. Fetching category for decision...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (catError || !categories || categories.length === 0) {
      console.error('❌ No categories found');
      process.exit(1);
    }

    const categoryId = categories[0].id;
    console.log('✅ Using category ID:', categoryId);

    // Step 4: Create a test decision with multiple options
    console.log('\n4. Creating test decision with options...');

    const decisionId = uuidv4();
    const now = new Date().toISOString();

    const decisionData = {
      id: decisionId,
      user_id: userId,
      title: 'F83 Test Decision - Edit Options',
      status: 'pending',
      category_id: categoryId,
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
      created_at: now,
      updated_at: now
    };

    const { data: insertedDecision, error: decisionError } = await supabase
      .from('decisions')
      .insert(decisionData)
      .select()
      .single();

    if (decisionError) {
      console.error('❌ Error creating decision:', decisionError.message);
      console.error('Details:', decisionError);
      process.exit(1);
    }

    console.log('✅ Test decision created successfully!');
    console.log('   Decision ID:', insertedDecision.id);
    console.log('   Title:', insertedDecision.title);
    console.log('   Options count:', insertedDecision.options.length);

    // Step 5: Verify the decision
    console.log('\n5. Verifying decision data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', insertedDecision.id)
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
      console.log('  ID:', insertedDecision.id);
      console.log('  Title:', insertedDecision.title);
      console.log('  Options:', insertedDecision.options.length, 'options');
      console.log('  URL:', `http://localhost:5190/decisions/${insertedDecision.id}`);
      console.log('\nOption details:');
      insertedDecision.options.forEach((opt, i) => {
        console.log(`  ${i + 1}. ${opt.title}`);
        console.log(`     Description: ${opt.description}`);
        console.log(`     Pros: ${opt.pros.length}, Cons: ${opt.cons.length}`);
      });
      console.log('\n✅ Ready for browser automation testing!');
      console.log('\nTest steps:');
      console.log('  1. Log in with f83test@example.com / test123456');
      console.log('  2. Navigate to decision detail page');
      console.log('  3. Click Edit button');
      console.log('  4. Rename Option A to "Option A - Renamed"');
      console.log('  5. Add new option "Option D - New"');
      console.log('  6. Delete Option C');
      console.log('  7. Save changes');
      console.log('  8. Verify all changes persisted');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupF83TestData();

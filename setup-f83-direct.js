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

    // Step 4: Create a test decision
    console.log('\n4. Creating test decision...');

    const decisionId = uuidv4();
    const now = new Date().toISOString();

    // First, get a category name
    const { data: categoryData } = await supabase
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .single();

    const categoryName = categoryData?.name || 'General';

    const decisionData = {
      id: decisionId,
      user_id: userId,
      title: 'F83 Test Decision - Edit Options',
      status: 'draft',
      category_id: categoryId,
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

    // Step 5: Create options for the decision
    console.log('\n5. Creating options...');

    const optionsData = [
      {
        id: uuidv4(),
        decision_id: decisionId,
        title: 'Option A - Original',
        is_chosen: false,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        decision_id: decisionId,
        title: 'Option B - Original',
        is_chosen: false,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        decision_id: decisionId,
        title: 'Option C - To Be Deleted',
        is_chosen: false,
        created_at: now,
        updated_at: now
      }
    ];

    const { data: insertedOptions, error: optionsError } = await supabase
      .from('options')
      .insert(optionsData)
      .select();

    if (optionsError) {
      console.error('❌ Error creating options:', optionsError.message);
      process.exit(1);
    }

    console.log('✅ Created', insertedOptions.length, 'options');

    // Step 6: Create pros and cons for each option
    console.log('\n6. Creating pros and cons...');

    const prosConsData = [
      // Option A pros/cons
      { id: uuidv4(), option_id: optionsData[0].id, type: 'pro', content: 'Pro 1', display_order: 1 },
      { id: uuidv4(), option_id: optionsData[0].id, type: 'pro', content: 'Pro 2', display_order: 2 },
      { id: uuidv4(), option_id: optionsData[0].id, type: 'con', content: 'Con 1', display_order: 1 },

      // Option B pros/cons
      { id: uuidv4(), option_id: optionsData[1].id, type: 'pro', content: 'Pro 3', display_order: 1 },
      { id: uuidv4(), option_id: optionsData[1].id, type: 'con', content: 'Con 2', display_order: 1 },
      { id: uuidv4(), option_id: optionsData[1].id, type: 'con', content: 'Con 3', display_order: 2 },

      // Option C pros/cons
      { id: uuidv4(), option_id: optionsData[2].id, type: 'pro', content: 'Pro 4', display_order: 1 },
      { id: uuidv4(), option_id: optionsData[2].id, type: 'con', content: 'Con 4', display_order: 1 },
    ];

    const { error: prosConsError } = await supabase
      .from('pros_cons')
      .insert(prosConsData);

    if (prosConsError) {
      console.error('❌ Error creating pros/cons:', prosConsError.message);
      process.exit(1);
    }

    console.log('✅ Created', prosConsData.length, 'pros/cons');

    // Step 7: Verify and display the test data
    console.log('\n7. Verifying test data...');

    // Fetch the complete decision with options
    const { data: verifyData, error: verifyError } = await supabase
      .from('decisions')
      .select(`
        *,
        options (
          id,
          title,
          is_chosen,
          pros_cons (
            id,
            type,
            content,
            display_order
          )
        )
      `)
      .eq('id', decisionId)
      .single();

    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
    } else {
      console.log('✅ Test data verified!');
      console.log('\n📋 TEST DATA READY FOR FEATURE #83');
      console.log('================================');
      console.log('Login credentials:');
      console.log('  Email:', testEmail);
      console.log('  Password:', testPassword);
      console.log('\nTest decision:');
      console.log('  ID:', verifyData.id);
      console.log('  Title:', verifyData.title);
      console.log('  Status:', verifyData.status);
      console.log('  Options:', verifyData.options.length, 'options');
      console.log('  URL:', `http://localhost:5190/decisions/${verifyData.id}`);
      console.log('\nOption details:');
      verifyData.options.forEach((opt, i) => {
        const pros = opt.pros_cons.filter(pc => pc.type === 'pro');
        const cons = opt.pros_cons.filter(pc => pc.type === 'con');
        console.log(`  ${i + 1}. ${opt.title}`);
        console.log(`     Pros: ${pros.length}, Cons: ${cons.length}`);
      });
      console.log('\n✅ Ready for browser automation testing!');
      console.log('\nTest steps:');
      console.log('  1. Log in with f83test@example.com / test123456');
      console.log('  2. Navigate to decision detail page');
      console.log('  3. Click Edit button');
      console.log('  4. Rename "Option A - Original" to "Option A - Renamed"');
      console.log('  5. Add new option "Option D - New"');
      console.log('  6. Delete "Option C - To Be Deleted"');
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

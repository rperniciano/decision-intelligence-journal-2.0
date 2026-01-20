/**
 * Feature #14: Cannot access another user's categories
 *
 * This test verifies that categories are properly scoped to users.
 *
 * Steps:
 * 1. Create User A
 * 2. Create custom category as User A
 * 3. Log out User A
 * 4. Create User B
 * 5. Fetch categories as User B
 * 6. Verify User A's custom category is NOT visible to User B
 */

const http = require('http');
require('dotenv').config();

// Configuration
const API_URL = 'localhost:4001';
const TEST_PREFIX = `f14-test-${Date.now()}`;

// Verify environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

// Store test data
const testData = {
  userA: {
    email: `${TEST_PREFIX}-user-a@example.com`,
    password: 'TestPassword123!',
    id: null,
    token: null,
    categoryId: null
  },
  userB: {
    email: `${TEST_PREFIX}-user-b@example.com`,
    password: 'TestPassword123!',
    id: null,
    token: null
  }
};

// Helper function to make HTTP requests
function makeRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://${API_URL}`);
    const options = {
      hostname: url.hostname,
      port: url.port || 4001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Helper function to create user via Supabase
async function createUser(email, password) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // First check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log(`  User already exists: ${email}`);
    return existingUser;
  }

  // Create new user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    throw new Error(`Failed to create user: ${authError.message}`);
  }

  console.log(`  ✅ Created user: ${email} (ID: ${authData.user.id})`);
  return authData.user;
}

// Main test function
async function testFeature14() {
  console.log('\n========================================');
  console.log('Feature #14: Cannot access another user\'s categories');
  console.log('========================================\n');

  try {
    // Step 1: Create User A
    console.log('Step 1: Creating User A...');
    const userA = await createUser(testData.userA.email, testData.userA.password);
    testData.userA.id = userA.id;

    // Get User A token
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data: signInA, error: signInErrorA } = await supabaseAuth.auth.signInWithPassword({
      email: testData.userA.email,
      password: testData.userA.password
    });

    if (signInErrorA) {
      throw new Error(`Failed to sign in User A: ${signInErrorA.message}`);
    }

    testData.userA.token = signInA.session.access_token;
    console.log(`  ✅ User A logged in (token: ${testData.userA.token.substring(0, 20)}...)`);

    // Step 2: Create custom category as User A
    console.log('\nStep 2: Creating custom category as User A...');
    const categoryName = `F14-UserA-${Date.now()}`;

    const createResult = await makeRequest(
      'POST',
      '/api/v1/categories',
      {
        name: categoryName,
        icon: '🔒',
        color: '#ff0000'
      },
      testData.userA.token
    );

    if (createResult.status !== 200 && createResult.status !== 201) {
      throw new Error(`Failed to create category: ${JSON.stringify(createResult.data)}`);
    }

    testData.userA.categoryId = createResult.data.id;
    console.log(`  ✅ Created category: ${categoryName} (ID: ${testData.userA.categoryId})`);

    // Verify User A can see their category
    console.log('\nVerifying User A can see their category...');
    const fetchResultA = await makeRequest(
      'GET',
      '/api/v1/categories',
      null,
      testData.userA.token
    );

    if (fetchResultA.status !== 200) {
      throw new Error(`Failed to fetch categories for User A: ${JSON.stringify(fetchResultA.data)}`);
    }

    const categoriesA = fetchResultA.data.categories || [];
    const userACategory = categoriesA.find(c => c.id === testData.userA.categoryId);

    if (!userACategory) {
      throw new Error('User A cannot see their own category!');
    }

    console.log(`  ✅ User A can see their category: ${userACategory.name}`);
    console.log(`  Total categories for User A: ${categoriesA.length}`);

    // Step 3: Log out User A (we'll just switch tokens)
    console.log('\nStep 3: Logging out User A...');
    // We'll create User B next, no explicit logout needed

    // Step 4: Create User B
    console.log('\nStep 4: Creating User B...');
    const userB = await createUser(testData.userB.email, testData.userB.password);
    testData.userB.id = userB.id;

    // Get User B token
    const { data: signInB, error: signInErrorB } = await supabaseAuth.auth.signInWithPassword({
      email: testData.userB.email,
      password: testData.userB.password
    });

    if (signInErrorB) {
      throw new Error(`Failed to sign in User B: ${signInErrorB.message}`);
    }

    testData.userB.token = signInB.session.access_token;
    console.log(`  ✅ User B logged in (token: ${testData.userB.token.substring(0, 20)}...)`);

    // Step 5: Fetch categories as User B
    console.log('\nStep 5: Fetching categories as User B...');
    const fetchResultB = await makeRequest(
      'GET',
      '/api/v1/categories',
      null,
      testData.userB.token
    );

    if (fetchResultB.status !== 200) {
      throw new Error(`Failed to fetch categories for User B: ${JSON.stringify(fetchResultB.data)}`);
    }

    const categoriesB = fetchResultB.data.categories || [];
    console.log(`  Total categories for User B: ${categoriesB.length}`);

    // Step 6: Verify User A's category is NOT visible to User B
    console.log('\nStep 6: Verifying User A\'s category is NOT visible to User B...');
    const leakedCategory = categoriesB.find(c => c.id === testData.userA.categoryId);

    if (leakedCategory) {
      console.error(`  ❌ SECURITY BREACH! User B can see User A's category:`);
      console.error(`     Category ID: ${leakedCategory.id}`);
      console.error(`     Category Name: ${leakedCategory.name}`);
      console.error(`     User ID: ${leakedCategory.user_id}`);
      throw new Error('SECURITY BREACH: Categories are NOT properly scoped to users!');
    }

    console.log('  ✅ User A\'s custom category is NOT visible to User B');
    console.log(`  ✅ User A category ID ${testData.userA.categoryId} not found in User B's results`);

    // Additional verification: Check all categories belong to User B or are system categories
    console.log('\nAdditional verification: Checking all category ownership...');
    let nonSystemOrUserBCategories = [];

    for (const cat of categoriesB) {
      if (cat.user_id !== null && cat.user_id !== testData.userB.id) {
        nonSystemOrUserBCategories.push(cat);
      }
    }

    if (nonSystemOrUserBCategories.length > 0) {
      console.error('  ❌ Found categories from other users:');
      nonSystemOrUserBCategories.forEach(cat => {
        console.error(`     - ${cat.name} (user_id: ${cat.user_id})`);
      });
      throw new Error('SECURITY BREACH: Categories from other users are visible!');
    }

    console.log('  ✅ All categories either belong to User B or are system categories (user_id is null)');

    // List all categories User B can see
    console.log('\nCategories visible to User B:');
    categoriesB.forEach((cat, index) => {
      const owner = cat.user_id === null ? 'System' : `User B (${cat.user_id})`;
      console.log(`  ${index + 1}. ${cat.name} - Owner: ${owner}`);
    });

    // Test summary
    console.log('\n========================================');
    console.log('Feature #14: PASSED ✅');
    console.log('========================================\n');
    console.log('Summary:');
    console.log(`  User A: ${testData.userA.email} (ID: ${testData.userA.id})`);
    console.log(`  User B: ${testData.userB.email} (ID: ${testData.userB.id})`);
    console.log(`  User A's category: ${categoryName} (ID: ${testData.userA.categoryId})`);
    console.log(`  User B can see: ${categoriesB.length} categories`);
    console.log(`  User B CANNOT see User A's category: ✅`);
    console.log('\n✅ Categories are properly scoped to users!');

    // Cleanup
    console.log('\nCleaning up test data...');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    await supabase.from('categories').delete().eq('id', testData.userA.categoryId);
    console.log('  ✅ Deleted test category');

    await supabase.auth.admin.deleteUser(testData.userA.id);
    console.log('  ✅ Deleted User A');

    await supabase.auth.admin.deleteUser(testData.userB.id);
    console.log('  ✅ Deleted User B');

    console.log('\n✅ Cleanup complete');

  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message);
    console.error('\nTest Data:');
    console.error(JSON.stringify(testData, null, 2));
    throw error;
  }
}

// Run the test
testFeature14().catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});

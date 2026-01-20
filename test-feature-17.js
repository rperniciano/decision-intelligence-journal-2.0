// Test Feature #17: Failed login shows no information leakage
// Verify that failed logins don't reveal if email exists

// Load environment variables
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim() || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim() || process.env.VITE_SUPABASE_ANON_KEY;

async function testLoginError(email, password, testName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: email,
        password: password,
        gotrue_meta_security: {}
      })
    });

    const data = await response.json();
    const status = response.status;

    console.log(`Status Code: ${status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    // Get the error message from different possible fields
    const errorMessage = data.error || data.msg || data.error_description || data.message || '';

    if (errorMessage) {
      console.log(`\nError Message: "${errorMessage}"`);

      // Check if error reveals whether user exists
      const revealsUserExists =
        errorMessage.toLowerCase().includes('email not found') ||
        errorMessage.toLowerCase().includes('user not found') ||
        errorMessage.toLowerCase().includes('invalid email') ||
        errorMessage.toLowerCase().includes('email not registered') ||
        errorMessage.toLowerCase().includes('no account found') ||
        errorMessage.toLowerCase().includes('user does not exist');

      const revealsWrongPassword =
        errorMessage.toLowerCase().includes('wrong password') ||
        errorMessage.toLowerCase().includes('incorrect password') ||
        errorMessage.toLowerCase().includes('invalid password');

      const isGeneric =
        errorMessage.toLowerCase().includes('invalid credentials') ||
        errorMessage.toLowerCase().includes('invalid login credentials') ||
        errorMessage.toLowerCase().includes('email or password');

      console.log(`\nAnalysis:`);
      console.log(`  - Reveals user exists: ${revealsUserExists ? '❌ YES (LEAK)' : '✅ NO'}`);
      console.log(`  - Reveals wrong password: ${revealsWrongPassword ? '❌ YES (LEAK)' : '✅ NO'}`);
      console.log(`  - Generic error: ${isGeneric ? '✅ YES (SECURE)' : '❌ NO (LEAK)'}`);

      return {
        status,
        error: errorMessage,
        message: errorMessage,
        revealsUserExists,
        revealsWrongPassword,
        isGeneric,
        secure: !revealsUserExists && !revealsWrongPassword && isGeneric
      };
    }

    console.log(`\n⚠️  Login succeeded when it should have failed!`);
    return { status, data, secure: false, error: 'No error message' };
  } catch (error) {
    console.error(`Request failed:`, error.message);
    return { error: error.message, secure: false };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('Feature #17: Failed Login Information Leakage Test');
  console.log('='.repeat(60));

  // Test 1: Non-existent email with any password
  const test1 = await testLoginError(
    `nonexistent-user-f17-${Date.now()}@example.com`,
    'SomePassword123!',
    'Test 1: Non-existent email'
  );

  // Test 2: Existing user with wrong password
  // First, create a test user
  const testEmail = `feature-17-test-${Date.now()}@example.com`;
  console.log(`\n${'='.repeat(60)}`);
  console.log('Creating test user for Test 2...');
  console.log('='.repeat(60));

  try {
    const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'CorrectPassword123!',
        gotrue_meta_security: {}
      })
    });

    if (createResponse.ok) {
      console.log(`✅ Test user created: ${testEmail}`);

      // Now test with wrong password
      const test2 = await testLoginError(
        testEmail,
        'WrongPassword123!',
        'Test 2: Existing user with wrong password'
      );

      // Compare error messages
      console.log(`\n${'='.repeat(60)}`);
      console.log('SECURITY ANALYSIS');
      console.log('='.repeat(60));

      console.log(`\nTest 1 (Non-existent user):`);
      console.log(`  Error: "${test1.error || test1.message}"`);
      console.log(`  Secure: ${test1.secure ? '✅ YES' : '❌ NO'}`);

      console.log(`\nTest 2 (Wrong password):`);
      console.log(`  Error: "${test2.error || test2.message}"`);
      console.log(`  Secure: ${test2.secure ? '✅ YES' : '❌ NO'}`);

      // Check if errors are the same
      const errorsMatch =
        (test1.error || test1.message) === (test2.error || test2.message);

      console.log(`\nConclusion:`);
      console.log(`  Error messages are identical: ${errorsMatch ? '✅ YES (SECURE)' : '❌ NO (LEAK)'}`);
      console.log(`  Both tests secure: ${test1.secure && test2.secure ? '✅ YES' : '❌ NO'}`);

      if (test1.secure && test2.secure && errorsMatch) {
        console.log(`\n✅ FEATURE #17: PASSING`);
        console.log('Failed logins do not reveal if email exists');
        process.exit(0);
      } else {
        console.log(`\n❌ FEATURE #17: FAILING`);
        console.log('Failed logins reveal information about user existence');
        process.exit(1);
      }
    } else {
      console.log('❌ Failed to create test user');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test setup failed:', error.message);
    process.exit(1);
  }
}

main();

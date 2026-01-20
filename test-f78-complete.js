/**
 * Feature #78: Emotions stored per decision
 * Full end-to-end test via API
 */

const http = require('http');

function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function signUpUser(email, password) {
  const data = {
    query: `
      mutation SignUp($email: String!, $password: String!) {
        signUp(email: $email, password: $password) {
          user {
            id
            email
          }
          accessToken
        }
      }
    `,
    variables: { email, password }
  };

  const res = await makeRequest('http://localhost:4001/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, data);

  return res;
}

async function feature78Test() {
  console.log('\n' + '='.repeat(70));
  console.log('Feature #78: Emotions stored per decision - End-to-End Test');
  console.log('='.repeat(70));

  const timestamp = Date.now();
  const testEmail = `f78-test-${timestamp}@example.com`;
  const testPassword = 'Test1234!';

  console.log('\n📝 Step 1: Creating test user...');
  console.log(`   Email: ${testEmail}`);

  // We'll need to use Supabase directly for signup since we don't have GraphQL
  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Create user via Supabase Admin
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  });

  if (userError) {
    console.log('❌ Failed to create user:', userError.message);
    return false;
  }

  const userId = userData.user.id;
  console.log(`✅ User created: ${userId}`);

  // Get session
  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  const token = sessionData.session.access_token;
  console.log(`✅ Session obtained`);

  // Helper function with auth
  function authRequest(url, options, data = null) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`;
    return makeRequest(url, options, data);
  }

  console.log('\n📝 Step 2: Creating decision with emotional_state="anxious"...');

  const decision1Data = {
    title: `F78 Test - Anxious Decision - ${timestamp}`,
    status: 'decided',
    emotional_state: 'anxious',
    notes: 'Testing Feature #78 - emotional state storage'
  };

  const res1 = await authRequest('http://localhost:4001/api/v1/decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, decision1Data);

  if (res1.status !== 201 && res1.status !== 200) {
    console.log(`❌ Failed to create decision (${res1.status})`);
    console.log('   Response:', res1.body);
    return false;
  }

  const decision1 = res1.body;
  console.log(`✅ Decision created! ID: ${decision1.id}`);
  console.log(`   Emotional State in response: ${decision1.emotional_state || decision1.emotionalState || 'NOT RETURNED'}`);

  console.log('\n📝 Step 3: Fetching decision to verify emotional_state...');

  const res2 = await authRequest(`http://localhost:4001/api/v1/decisions/${decision1.id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (res2.status !== 200) {
    console.log(`❌ Failed to fetch decision (${res2.status})`);
    return false;
  }

  const fetched = res2.body;
  const emotionValue = fetched.emotional_state || fetched.emotionalState;

  console.log(`✅ Decision fetched!`);
  console.log(`   Emotional State in DB: ${emotionValue || 'NOT FOUND'}`);

  if (emotionValue !== 'anxious') {
    console.log(`❌ FAIL: Expected "anxious", got "${emotionValue}"`);
    return false;
  }

  console.log('\n📝 Step 4: Creating second decision with emotional_state="confident"...');

  const decision2Data = {
    title: `F78 Test - Confident Decision - ${timestamp}`,
    status: 'decided',
    emotional_state: 'confident',
    notes: 'Testing Feature #78 - emotional state storage'
  };

  const res3 = await authRequest('http://localhost:4001/api/v1/decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, decision2Data);

  if (res3.status !== 201 && res3.status !== 200) {
    console.log(`❌ Failed to create second decision (${res3.status})`);
    return false;
  }

  const decision2 = res3.body;
  console.log(`✅ Second decision created! ID: ${decision2.id}`);

  console.log('\n📝 Step 5: Listing all decisions to verify emotions...');

  const res4 = await authRequest('http://localhost:4001/api/v1/decisions', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (res4.status !== 200) {
    console.log(`❌ Failed to list decisions (${res4.status})`);
    return false;
  }

  const listData = res4.body;
  const decisions = listData.decisions || listData;
  const testDecisions = decisions.filter(d => d.title && d.title.includes('F78 Test'));

  console.log(`✅ Found ${testDecisions.length} test decisions`);

  let allCorrect = true;
  for (const d of testDecisions) {
    const emotion = d.emotional_state || d.emotionalState;
    if (d.title.includes('Anxious')) {
      if (emotion === 'anxious') {
        console.log(`   ✅ Anxious decision → emotion: ${emotion}`);
      } else {
        console.log(`   ❌ Anxious decision → emotion: ${emotion} (expected: anxious)`);
        allCorrect = false;
      }
    } else if (d.title.includes('Confident')) {
      if (emotion === 'confident') {
        console.log(`   ✅ Confident decision → emotion: ${emotion}`);
      } else {
        console.log(`   ❌ Confident decision → emotion: ${emotion} (expected: confident)`);
        allCorrect = false;
      }
    }
  }

  console.log('\n📝 Step 6: Updating decision with new emotional_state...');

  const updateData = {
    emotional_state: 'excited'
  };

  const res5 = await authRequest(`http://localhost:4001/api/v1/decisions/${decision1.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, updateData);

  if (res5.status !== 200) {
    console.log(`❌ Failed to update decision (${res5.status})`);
    return false;
  }

  const updated = res5.body;
  const updatedEmotion = updated.emotional_state || updated.emotionalState;

  console.log(`✅ Decision updated!`);
  console.log(`   New emotional state: ${updatedEmotion || 'NOT FOUND'}`);

  if (updatedEmotion !== 'excited') {
    console.log(`❌ FAIL: Expected "excited", got "${updatedEmotion}"`);
    return false;
  }

  console.log('\n📝 Step 7: Verifying update persisted in database...');

  const res6 = await authRequest(`http://localhost:4001/api/v1/decisions/${decision1.id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (res6.status !== 200) {
    console.log(`❌ Failed to fetch updated decision (${res6.status})`);
    return false;
  }

  const verified = res6.body;
  const verifiedEmotion = verified.emotional_state || verified.emotionalState;

  console.log(`✅ Decision fetched after update!`);
  console.log(`   Emotional state: ${verifiedEmotion || 'NOT FOUND'}`);

  if (verifiedEmotion !== 'excited') {
    console.log(`❌ FAIL: Update did not persist. Expected "excited", got "${verifiedEmotion}"`);
    return false;
  }

  if (allCorrect) {
    console.log('\n' + '='.repeat(70));
    console.log('✅ FEATURE #78 VERIFICATION PASSED!');
    console.log('='.repeat(70));
    console.log('\nSummary:');
    console.log('  ✅ emotional_state can be set on decision creation');
    console.log('  ✅ emotional_state is returned in API responses');
    console.log('  ✅ emotional_state persists in database');
    console.log('  ✅ emotional_state can be updated');
    console.log('  ✅ Updates persist correctly');
    console.log(`\nTest timestamp: ${timestamp}`);
    console.log(`Test user: ${testEmail}`);
    console.log('\n' + '='.repeat(70));

    return true;
  }

  return false;
}

feature78Test().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Test error:', err.message);
  process.exit(1);
});

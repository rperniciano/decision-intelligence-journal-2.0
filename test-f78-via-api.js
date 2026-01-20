/**
 * Test Feature #78: Emotions stored per decision
 * Using the API endpoint which correctly maps emotional_state to detected_emotional_state
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

async function testEmotionalStateStorage() {
  console.log('Testing Feature #78: Emotions stored per decision\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create decision with emotional state 'Anxious'
    console.log('\n📝 Step 1: Creating decision with emotional state "Anxious"...');

    const timestamp = Date.now();
    const createData = {
      title: `F78 Test - Anxious Decision - ${timestamp}`,
      status: 'decided',
      emotional_state: 'anxious',
      notes: 'Testing emotional state persistence for Feature #78',
    };

    const createRes = await makeRequest('http://localhost:4001/api/v1/decisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: We'll need auth token, but for now let's see what happens
      }
    }, createData);

    if (createRes.status === 401) {
      console.log('❌ Authentication required');
      console.log('   This test requires valid authentication');
      return false;
    }

    if (createRes.status !== 201 && createRes.status !== 200) {
      console.log(`❌ Failed to create decision (${createRes.status})`);
      console.log('   Response:', createRes.body);
      return false;
    }

    const decision = createRes.body;
    console.log(`✅ Decision created successfully!`);
    console.log(`   ID: ${decision.id}`);
    console.log(`   Title: ${decision.title}`);
    console.log(`   Emotional State: ${decision.emotional_state || 'NOT RETURNED'}`);

    // Step 2: Verify the decision was stored with correct emotional state
    console.log('\n📝 Step 2: Fetching decision to verify emotional state...');

    const getRes = await makeRequest(`http://localhost:4001/api/v1/decisions/${decision.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (getRes.status !== 200) {
      console.log(`❌ Failed to fetch decision (${getRes.status})`);
      return false;
    }

    const fetchedDecision = getRes.body;
    console.log(`✅ Decision fetched successfully!`);
    console.log(`   Emotional State in DB: ${fetchedDecision.emotional_state || 'NOT FOUND'}`);

    // Step 3: Create another decision with different emotion
    console.log('\n📝 Step 3: Creating another decision with emotional state "Confident"...');

    const createData2 = {
      title: `F78 Test - Confident Decision - ${timestamp}`,
      status: 'decided',
      emotional_state: 'confident',
      notes: 'Testing emotional state persistence for Feature #78',
    };

    const createRes2 = await makeRequest('http://localhost:4001/api/v1/decisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, createData2);

    if (createRes2.status !== 201 && createRes2.status !== 200) {
      console.log(`❌ Failed to create second decision (${createRes2.status})`);
      return false;
    }

    const decision2 = createRes2.body;
    console.log(`✅ Second decision created successfully!`);
    console.log(`   ID: ${decision2.id}`);
    console.log(`   Emotional State: ${decision2.emotional_state || 'NOT RETURNED'}`);

    // Step 4: List all decisions and verify each has correct emotion
    console.log('\n📝 Step 4: Listing all decisions to verify emotions...');

    const listRes = await makeRequest('http://localhost:4001/api/v1/decisions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (listRes.status !== 200) {
      console.log(`❌ Failed to list decisions (${listRes.status})`);
      return false;
    }

    const decisions = listRes.body.decisions || listRes.body;
    const testDecisions = decisions.filter(d => d.title.includes('F78 Test'));

    console.log(`✅ Found ${testDecisions.length} test decisions`);

    for (const d of testDecisions) {
      if (d.title.includes('Anxious')) {
        if (d.emotional_state === 'anxious') {
          console.log(`   ✅ "${d.title.substring(0, 40)}..." → emotion: ${d.emotional_state}`);
        } else {
          console.log(`   ❌ "${d.title.substring(0, 40)}..." → emotion: ${d.emotional_state} (expected: anxious)`);
          return false;
        }
      } else if (d.title.includes('Confident')) {
        if (d.emotional_state === 'confident') {
          console.log(`   ✅ "${d.title.substring(0, 40)}..." → emotion: ${d.emotional_state}`);
        } else {
          console.log(`   ❌ "${d.title.substring(0, 40)}..." → emotion: ${d.emotional_state} (expected: confident)`);
          return false;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ FEATURE #78 VERIFICATION PASSED!');
    console.log('   Emotional states are correctly stored and retrieved');
    console.log(`\n   Test timestamp: ${timestamp}`);

    return true;

  } catch (err) {
    console.error('\n❌ Error during test:', err.message);
    return false;
  }
}

testEmotionalStateStorage().then(success => {
  process.exit(success ? 0 : 1);
});

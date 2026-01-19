// Delete the test decision
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:4011/api/v1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const decisionId = '48c7c4b1-4740-4366-abf8-c1f811163165';

async function deleteDecision() {
  console.log('Logging in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'feature266@test.com',
    password: 'test123456'
  });

  if (error) throw error;
  const token = data.session.access_token;

  console.log(`Deleting decision ${decisionId}...`);
  const response = await fetch(`${API_URL}/decisions/${decisionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed: ${response.status} - ${text}`);
  }

  console.log('\n✓ Decision deleted!');
  console.log('\nNow try to interact with it in the browser:');
  console.log('- Click "Record Outcome" button');
  console.log('- Should show graceful error message');
}

deleteDecision();

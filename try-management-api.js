import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Management API endpoints...\n');

// The Supabase Management API uses a different base URL
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const managementUrl = `https://api.supabase.com/v1/projects/${projectId}`;

console.log('Project ID:', projectId);
console.log('Management URL:', managementUrl);
console.log('');

try {
  console.log('Attempting to execute SQL via Management API...');

  const response = await fetch(`${managementUrl}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'SELECT 1 as test'
    })
  });

  console.log('Response status:', response.status);
  const data = await response.text();
  console.log('Response body:', data);

  if (response.ok) {
    console.log('\n✅ Management API query execution works!');
    console.log('Can execute migration via Management API!');
  } else {
    console.log('\n❌ Management API query execution failed');
    console.log('Status:', response.status, response.statusText);
  }

} catch (error) {
  console.log('\n❌ Error:', error.message);
}

// Try PostgreSQL endpoint
try {
  console.log('\nTrying PostgreSQL endpoint...');

  const response = await fetch(`${managementUrl}/postgres`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'SELECT 1 as test'
    })
  });

  console.log('Response status:', response.status);
  const data = await response.text();
  console.log('Response body:', data);

} catch (error) {
  console.log('\n❌ Error:', error.message);
}

// Try database endpoint
try {
  console.log('\nTrying database endpoint...');

  const response = await fetch(`${managementUrl}/database`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'SELECT 1 as test'
    })
  });

  console.log('Response status:', response.status);
  const data = await response.text();
  console.log('Response body:', data);

} catch (error) {
  console.log('\n❌ Error:', error.message);
}

console.log('\n========================================');
console.log('CONCLUSION');
console.log('========================================');
console.log('If none of the above worked, manual execution is required.');
console.log('\nDashboard: https://supabase.com/dashboard/project/' + projectId + '/sql');

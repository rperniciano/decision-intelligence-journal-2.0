import { config } from 'dotenv';
config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Migration API Endpoints...\n');

// The Supabase Management API uses a different base URL
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const managementUrl = `https://api.supabase.com/v1/projects/${projectId}`;

console.log('Project ID:', projectId);
console.log('Management URL:', managementUrl);
console.log('');

// Test various endpoints
const endpoints = [
  { name: 'Database Query', path: '/database/query' },
  { name: 'PostgreSQL', path: '/postgres' },
  { name: 'Database', path: '/database' },
  { name: 'Migrations', path: '/database/migrations' },
  { name: 'SQL', path: '/sql' }
];

for (const endpoint of endpoints) {
  try {
    console.log(`\nTesting: ${endpoint.name} (${endpoint.path})`);

    const response = await fetch(`${managementUrl}${endpoint.path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT 1 as test'
      })
    });

    console.log(`  Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ SUCCESS!');
      console.log('  Response:', data);
    } else {
      const text = await response.text();
      console.log('  ❌ Failed');
      console.log('  Response:', text.substring(0, 200));
    }

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
}

console.log('\n========================================');
console.log('CONCLUSION');
console.log('========================================');
console.log('If any endpoint succeeded, we can execute the migration!');
console.log('If all failed, manual execution via Dashboard is required.');
console.log('\nDashboard: https://supabase.com/dashboard/project/' + projectId + '/sql');
console.log('\nMigration file: apps/api/migrations/create_outcomes_table.sql');

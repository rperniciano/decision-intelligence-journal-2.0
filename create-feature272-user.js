/**
 * Create a test user for Feature #272 testing
 */
const Database = require('better-sqlite3');
const db = new Database('features.db');

console.log('Creating test user for Feature #272...');

// This would normally use Supabase, but for testing we'll document what we need
console.log('User email: test_f272_slow@example.com');
console.log('User password: testpass123');
console.log('\nTo create this user, you can:');
console.log('1. Use the Supabase dashboard to create the user manually');
console.log('2. Or use the registration flow and confirm via email');
console.log('3. Or disable email confirmation in Supabase for testing');

db.close();

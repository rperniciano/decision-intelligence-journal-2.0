const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the migration SQL
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'migration-add-outcomes-tables.sql'),
  'utf8'
);

console.log('='.repeat(80));
console.log('MIGRATION SQL - Copy and paste this into Supabase SQL Editor');
console.log('='.repeat(80));
console.log('\n' + migrationSQL + '\n');
console.log('='.repeat(80));
console.log('\nSteps to run migration:');
console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
console.log('2. Copy the SQL above');
console.log('3. Paste it into the SQL Editor');
console.log('4. Click "Run" button');
console.log('5. Come back and run: node check-outcomes-tables.js');
console.log('='.repeat(80));

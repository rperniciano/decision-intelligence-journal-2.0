// Feature #276: JSON export includes nested data - Verification script
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'features.db'));

console.log('=== Feature #276: JSON export includes nested data ===');
console.log('');
console.log('Category: Export/Import');
console.log('Description: Verify JSON structure completeness');
console.log('');
console.log('Steps:');
console.log('  1. Have decision with options, pros/cons, outcomes');
console.log('  2. Export as JSON');
console.log('  3. Verify options array nested under decision');
console.log('  4. Verify pros/cons under options');
console.log('  5. Verify outcomes included');
console.log('');
console.log('Dependencies: Feature #275 must be passing (JSON export with nested data)');
console.log('');
console.log('This feature VERIFIES the implementation from Feature #275');
console.log('by testing with browser automation.');

db.close();

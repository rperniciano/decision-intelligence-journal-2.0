const Database = require('better-sqlite3');
const db = new Database('./features.db', { readonly: true });

// Get a passing feature that would have a test user
const row = db.prepare('SELECT * FROM features WHERE passes = 1 LIMIT 1').get();
console.log('Sample passing feature:', JSON.stringify(row, null, 2));

db.close();

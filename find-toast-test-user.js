const sqlite3 = require('better-sqlite3');
const path = require('path');

const db = new sqlite3(path.join(__dirname, 'features.db'));

// Find any toast test user
const result = db.prepare(`
  SELECT email, password
  FROM users
  WHERE email LIKE '%toast%'
  ORDER BY created_at DESC
  LIMIT 1
`).get();

console.log('Toast Test User:');
console.log(JSON.stringify(result, null, 2));

db.close();

const db = require('better-sqlite3')('features.db');
const stmt = db.prepare('SELECT email FROM test_users WHERE feature_id = 271');
const result = stmt.get();
console.log(result ? result.email : 'NOT_FOUND');

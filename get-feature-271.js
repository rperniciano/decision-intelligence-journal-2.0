const db = require('better-sqlite3')('features.db');
const stmt = db.prepare('SELECT * FROM features WHERE id = 271');
const feature = stmt.get();
console.log(JSON.stringify(feature, null, 2));

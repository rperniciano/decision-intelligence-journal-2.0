const Database = require('better-sqlite3');
const db = new Database('features.db');
const stmt = db.prepare('SELECT * FROM features WHERE id = 284');
const feature = stmt.get();
console.log(JSON.stringify(feature, null, 2));
db.close();

const sqlite3 = require('better-sqlite3');
const path = require('path');

const db = new sqlite3(path.join(__dirname, 'features.db'));

// Check feature #227
const feature = db.prepare('SELECT * FROM features WHERE id = 227').get();

console.log('Feature #227:');
console.log(JSON.stringify(feature, null, 2));

db.close();

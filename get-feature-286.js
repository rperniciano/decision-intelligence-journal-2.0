const Database = require('better-sqlite3');
const db = new Database('./features.db', { readonly: true });

const row = db.prepare('SELECT * FROM features WHERE id = 286').get();
console.log(JSON.stringify(row, null, 2));

db.close();

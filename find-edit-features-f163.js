const Database = require('better-sqlite3');
const db = new Database('features.db');
const stmt = db.prepare("SELECT id, name, category FROM features WHERE name LIKE '%edit%' OR name LIKE '%Edit%' OR name LIKE '%update%' OR name LIKE '%Update%' ORDER BY id");
const features = stmt.all();
features.forEach(f => console.log(f.id + ': ' + f.name + ' (' + f.category + ')'));
db.close();

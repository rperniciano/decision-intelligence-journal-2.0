const Database = require('better-sqlite3');
const db = new Database('features.db');

const editFeatureIds = [54, 82, 83, 84];
const stmt = db.prepare(`SELECT id, name, category, passes FROM features WHERE id IN (${editFeatureIds.join(',')}) ORDER BY id`);
const features = stmt.all();

console.log('Edit Feature Status:');
features.forEach(f => {
  console.log(f.id + ': ' + f.name + ' - ' + (f.passes ? 'PASSING ✅' : 'FAILING ❌'));
});

db.close();

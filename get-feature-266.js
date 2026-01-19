const Database = require('better-sqlite3');
const db = new Database('./features.db', { readonly: true });

const row = db.prepare('SELECT id, priority, category, name, description, steps FROM features WHERE id = 266').get();

if (row) {
  console.log(JSON.stringify(row, null, 2));
} else {
  console.log('Feature 266 not found');
}

db.close();

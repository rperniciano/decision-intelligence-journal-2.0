const Database = require('better-sqlite3');
const fs = require('fs');

const dbPath = './features.db';

if (fs.existsSync(dbPath)) {
  const db = new Database(dbPath, { readonly: true });
  const result = db.prepare(`SELECT id, category, name, description, steps FROM features WHERE id = 291`).get();
  console.log(JSON.stringify(result, null, 2));
  db.close();
} else {
  console.log('Database not found');
}

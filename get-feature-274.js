const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'features.db'), { readonly: true });

const feature = db.prepare(`
  SELECT id, priority, category, name, description, steps, passes, in_progress, dependencies
  FROM features
  WHERE id = 274
`).get();

console.log('Feature #274:');
console.log(JSON.stringify(feature, null, 2));

db.close();

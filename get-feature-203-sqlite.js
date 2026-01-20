const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('features.db', { readonly: true });

const feature = db.prepare(`
  SELECT id, name, category, description, steps, passes, in_progress
  FROM features
  WHERE id = ?
`).get(203);

if (feature) {
  console.log('Feature #203:');
  console.log('===============');
  console.log('Name:', feature.name);
  console.log('Category:', feature.category);
  console.log('Description:', feature.description);
  console.log('Steps:', feature.steps);
  console.log('Passes:', feature.passes);
  console.log('In Progress:', feature.in_progress);
} else {
  console.log('Feature #203 not found');
}

db.close();

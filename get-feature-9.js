const Database = require('better-sqlite3');
const db = new Database('./features.db', { readonly: true });

const row = db.prepare('SELECT * FROM features WHERE id = 9').get();

if (row) {
  console.log('Feature #9:');
  console.log('  Category:', row.category);
  console.log('  Name:', row.name);
  console.log('  Description:', row.description);
  console.log('  Steps:', row.steps);
  console.log('  Passes:', row.passes);
  console.log('  In Progress:', row.in_progress);
} else {
  console.log('Feature #9 not found');
}

db.close();

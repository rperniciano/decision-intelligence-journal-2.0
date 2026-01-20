const Database = require('better-sqlite3');
const db = new Database('features.db');

const feature = db.prepare('SELECT * FROM features WHERE id = 16').get();

if (feature) {
  console.log('Feature #16:');
  console.log('ID:', feature.id);
  console.log('Category:', feature.category);
  console.log('Name:', feature.name);
  console.log('Description:', feature.description);
  console.log('Steps:', feature.steps);
  console.log('Passing:', feature.passes ? 'YES' : 'NO');
  console.log('In Progress:', feature.in_progress ? 'YES' : 'NO');
  console.log('Priority:', feature.priority);
} else {
  console.log('Feature #16 not found');
}

db.close();

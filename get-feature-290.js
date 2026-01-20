const Database = require('better-sqlite3');
const db = new Database('features.db');

const feature = db.prepare('SELECT * FROM features WHERE id = 290').get();

if (feature) {
  console.log('Feature #290:');
  console.log('ID:', feature.id);
  console.log('Priority:', feature.priority);
  console.log('Category:', feature.category);
  console.log('Name:', feature.name);
  console.log('Description:', feature.description);
  console.log('Steps:', feature.steps);
  console.log('Passes:', feature.passes);
  console.log('In Progress:', feature.in_progress);
  console.log('Dependencies:', feature.dependencies);
} else {
  console.log('Feature #290 not found');
}

db.close();

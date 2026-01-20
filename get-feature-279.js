const Database = require('better-sqlite3');
const db = new Database('features.db');

const feature = db.prepare('SELECT id, name, category, description, steps FROM features WHERE id = 279').get();

if (feature) {
  console.log('Feature #279:');
  console.log('Name:', feature.name);
  console.log('Category:', feature.category);
  console.log('Description:', feature.description);
  console.log('\nSteps:');
  console.log(feature.steps);
} else {
  console.log('Feature #279 not found');
}

db.close();

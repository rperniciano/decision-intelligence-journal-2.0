const Database = require('better-sqlite3');
const db = new Database('features.db');

const feature = db.prepare(`
  SELECT id, priority, category, name, description, steps, passes, in_progress, dependencies
  FROM features
  WHERE id = 289
`).get();

if (feature) {
  console.log('Feature #289:');
  console.log('ID:', feature.id);
  console.log('Priority:', feature.priority);
  console.log('Category:', feature.category);
  console.log('Name:', feature.name);
  console.log('Description:', feature.description);
  console.log('\nSteps:');
  console.log(feature.steps);
  console.log('\nStatus:');
  console.log('- Passes:', feature.passes);
  console.log('- In Progress:', feature.in_progress);
  console.log('- Dependencies:', feature.dependencies);
} else {
  console.log('Feature #289 not found');
}

db.close();

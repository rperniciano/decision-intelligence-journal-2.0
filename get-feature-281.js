const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'features.db'));

const feature = db.prepare(`
  SELECT id, priority, category, name, description, steps, passes, in_progress
  FROM features
  WHERE id = 281
`).get();

if (feature) {
  console.log('Feature #281:');
  console.log('='.repeat(80));
  console.log(`ID: ${feature.id}`);
  console.log(`Priority: ${feature.priority}`);
  console.log(`Category: ${feature.category}`);
  console.log(`Name: ${feature.name}`);
  console.log(`Status: ${feature.passes ? 'PASSING' : 'PENDING'} ${feature.in_progress ? '(IN PROGRESS)' : ''}`);
  console.log(`\nDescription:\n${feature.description}`);
  console.log(`\nSteps:`);
  const steps = JSON.parse(feature.steps);
  steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
} else {
  console.log('Feature #281 not found!');
}

db.close();

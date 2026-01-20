const Database = require('better-sqlite3');
const db = new Database('features.db');

const feature = db.prepare(`
  SELECT id, priority, category, name, description, steps, passes, in_progress, dependencies
  FROM features
  WHERE id = 288
`).get();

if (feature) {
  console.log('Feature #288 Status:');
  console.log('='.repeat(60));
  console.log('ID:', feature.id);
  console.log('Priority:', feature.priority);
  console.log('Category:', feature.category);
  console.log('Name:', feature.name);
  console.log('Description:', feature.description);
  console.log('\nStatus:');
  console.log('- Passes:', feature.passes ? '✅ YES' : '❌ NO');
  console.log('- In Progress:', feature.in_progress ? '⏳ YES' : '✅ NO (completed)');
  console.log('\nSteps:');
  const steps = typeof feature.steps === 'string' ? JSON.parse(feature.steps) : feature.steps;
  steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
  console.log('\n' + '='.repeat(60));
  if (feature.passes) {
    console.log('✅ Feature #288 is PASSING');
  } else {
    console.log('❌ Feature #288 is NOT PASSING');
  }
} else {
  console.log('Feature #288 not found');
}

db.close();

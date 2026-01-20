const db = require('better-sqlite3')('features.db');
const f = db.prepare('SELECT * FROM features WHERE id = 287').get();
console.log(JSON.stringify(f, null, 2));
const steps = db.prepare('SELECT * FROM feature_steps WHERE feature_id = 287 ORDER BY step_order').all();
console.log('\nSteps:');
steps.forEach(s => console.log(`  ${s.step_order}. ${s.instruction}`));

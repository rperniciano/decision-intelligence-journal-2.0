const Database = require('better-sqlite3');
const db = new Database('features.db');
const row = db.prepare('SELECT id, priority, category, name, description, steps, passes, in_progress, dependencies FROM features WHERE id = 256').get();
if (row) {
    console.log('ID:', row.id);
    console.log('Priority:', row.priority);
    console.log('Category:', row.category);
    console.log('Name:', row.name);
    console.log('Description:', row.description);
    console.log('Steps:', row.steps);
    console.log('Passes:', row.passes);
    console.log('In Progress:', row.in_progress);
    console.log('Dependencies:', row.dependencies);
}
db.close();

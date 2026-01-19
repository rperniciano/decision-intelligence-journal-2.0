const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('features.db');
db.get('SELECT id, priority, category, name, description, steps, passes, in_progress, dependencies FROM features WHERE id = 256', (err, row) => {
    if (err) console.error(err);
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
});

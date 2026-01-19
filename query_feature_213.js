const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'features.db');
const db = new sqlite3.Database(dbPath);

const sql = `SELECT id, priority, category, name, description, steps, passes, in_progress, dependencies
              FROM features
              WHERE id = 213`;

db.get(sql, [], (err, row) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  if (row) {
    console.log(JSON.stringify(row, null, 2));
  } else {
    console.log('Feature #213 not found');
  }
  db.close();
});

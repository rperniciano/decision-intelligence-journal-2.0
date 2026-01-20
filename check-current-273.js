const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./features.db');

db.get('SELECT * FROM features WHERE id = 273', (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else if (row) {
    console.log('Current Feature #273:');
    console.log(JSON.stringify(row, null, 2));
  } else {
    console.log('Feature #273 not found');
  }
  db.close();
});

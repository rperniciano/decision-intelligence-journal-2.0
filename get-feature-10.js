const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'features.db'), { readonly: true });

try {
  const feature = db.prepare('SELECT * FROM features WHERE id = 10').get();
  if (feature) {
    console.log(JSON.stringify(feature, null, 2));
  } else {
    console.log('Feature #10 not found');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}

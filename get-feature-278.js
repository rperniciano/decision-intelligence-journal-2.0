const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function getFeature() {
  const db = await open({
    filename: './features.db',
    driver: sqlite3.Database
  });

  const feature = await db.get('SELECT * FROM features WHERE id = 278');
  console.log(JSON.stringify(feature, null, 2));

  await db.close();
}

getFeature().catch(console.error);

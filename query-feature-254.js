const sqlite3 = require('sql.js');

async function main() {
  const SQL = await sqlite3();
  const fs = require('fs');
  const fileBuffer = fs.readFileSync('features.db');
  const db = new SQL.Database(fileBuffer);
  const result = db.exec('SELECT * FROM features WHERE id = 254');
  if (result.length > 0) {
    const columns = result[0].columns;
    const values = result[0].values[0];
    const obj = {};
    columns.forEach((col, i) => obj[col] = values[i]);
    console.log(JSON.stringify(obj, null, 2));
  }
  db.close();
}

main().catch(console.error);

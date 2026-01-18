const sql = require('sql.js');
const fs = require('fs');

async function main() {
  const SQL = await sql.default();
  const buffer = fs.readFileSync('D:\\Programmi\\PORTFOLIO\\decision-intelligence-journal-2.0\\features.db');
  const db = new SQL.Database(buffer);
  const result = db.exec('SELECT * FROM features WHERE id = 245');
  if (result.length > 0) {
    const columns = result[0].columns;
    const values = result[0].values[0];
    const row = {};
    columns.forEach((col, i) => row[col] = values[i]);
    console.log(JSON.stringify(row, null, 2));
  }
  db.close();
}
main();

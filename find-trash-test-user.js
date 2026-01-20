const sqlite3 = require('better-sqlite3');
const path = require('path');

const db = new sqlite3(path.join(__dirname, 'features.db'));

const user = db.prepare('SELECT email, password FROM users WHERE email LIKE "%trash%" LIMIT 1').get();

console.log('Trash Test User:');
console.log(JSON.stringify(user, null, 2));

db.close();

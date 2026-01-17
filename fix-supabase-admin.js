const fs = require('fs');

const content = fs.readFileSync('apps/api/src/server.ts', 'utf8');
const updated = content.replace(/supabaseAdmin/g, 'supabase');
fs.writeFileSync('apps/api/src/server.ts', updated);

const count = (content.match(/supabaseAdmin/g) || []).length;
console.log(`Replaced ${count} instances of supabaseAdmin with supabase`);

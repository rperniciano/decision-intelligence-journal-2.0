// Generate URL with very long query string for testing Feature #151
const longParam = 'a'.repeat(2500);
const longUrl = `http://localhost:5173/?test=${longParam}`;
console.log(longUrl);

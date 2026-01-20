// Generate extremely long URL for testing Feature #151
const longParam = 'b'.repeat(8000);
const longUrl = `http://localhost:5173/login?test=${longParam}`;
console.log(longUrl);

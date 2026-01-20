// Check F263 status via API
const https = require('https');
const http = require('http');

// The feature management is via MCP, let's check the progress file
const fs = require('fs');
const progressContent = fs.readFileSync('claude-progress.txt', 'utf8');

console.log('=== Feature #263 Status Check ===\n');
console.log('Recent progress notes:');
const lines = progressContent.split('\n');
const last30 = lines.slice(-30);
console.log(last30.join('\n'));

console.log('\n=== Summary ===');
console.log('Feature #263 was tested and found to have a fundamental database schema issue.');
console.log('The follow_up_date column stores DATE only (no time), making time-based');
console.log('quiet hours filtering impossible to implement correctly.');
console.log('\nStatus: FAILING (regression detected - fundamental issue)');

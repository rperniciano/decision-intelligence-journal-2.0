const fs = require('fs');

const csvContent = fs.readFileSync('.playwright-mcp/decisions-export-2026-01-20.csv', 'utf8');
const lines = csvContent.split('\n').filter(l => l.trim());

console.log('=== Feature #278 CSV Export Verification ===\n');
console.log('Total lines (including header):', lines.length);
console.log('Header:', lines[0]);
console.log('Data rows:', lines.length - 1);

const dataLines = lines.slice(1);
const titles = dataLines.map(l => l.split(',')[0]);
const descriptions = dataLines.map(l => {
  const parts = l.split(',');
  return parts[parts.length - 3]; // Description is before notes
});

console.log('\n=== All Decision Titles ===');
titles.forEach((title, i) => {
  console.log(`${i + 1}. ${title}`);
});

console.log('\n=== Verification ===');
console.log('✓ Total decisions in CSV:', titles.length);
console.log('✓ Expected: 15');
console.log('✓ Match:', titles.length === 15 ? 'YES ✓' : 'NO ✗');
console.log('✓ Missing titles:', titles.filter(t => !t || t === '').length);
console.log('✓ Missing descriptions:', descriptions.filter(d => !d || d === '').length);

// Check for duplicates
const uniqueTitles = new Set(titles);
console.log('✓ Unique titles:', uniqueTitles.size);
console.log('✓ Duplicates:', titles.length - uniqueTitles.size);

console.log('\n=== Feature #278 Status ===');
if (titles.length === 15 && titles.filter(t => !t).length === 0) {
  console.log('✅ PASSING - All 15 decisions exported with no missing data');
} else {
  console.log('❌ FAILING - Missing or incomplete data');
}

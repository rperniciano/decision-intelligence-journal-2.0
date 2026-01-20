const fs = require('fs');

const pdfPath = '.playwright-mcp/decisions-export-2026-01-20.pdf';
const pdfData = fs.readFileSync(pdfPath);

// Check for our test decision titles
const testTitles = [
  'F280_TEST: Career Path Decision',
  'F280_TEST: Technology Stack Decision',
  'F280_TEST: Office Location Decision',
  'F280_TEST: Team Structure Decision',
  'F280_TEST: Product Launch Decision'
];

console.log('Verifying PDF contains real test data:\n');
testTitles.forEach(title => {
  const exists = pdfData.indexOf(title) > -1;
  console.log(`${exists ? '✓' : '✗'} ${title}`);
});

// Check for PDF structure elements
console.log('\nVerifying PDF structure:\n');
const structureChecks = [
  { name: 'Title Page Header', text: 'Decision Intelligence Journal' },
  { name: 'Total Decisions', text: 'Total Decisions: 5' },
  { name: 'Export Date', text: 'Exported on' },
  { name: 'Status Indicator', text: 'Status:' },
  { name: 'Category Label', text: 'Category:' },
];

structureChecks.forEach(check => {
  const exists = pdfData.indexOf(check.text) > -1;
  console.log(`${exists ? '✓' : '✗'} ${check.name}: "${check.text}"`);
});

console.log('\n✅ PDF verification complete!');

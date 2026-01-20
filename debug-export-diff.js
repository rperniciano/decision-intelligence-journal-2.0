const fs = require('fs');

const exportData = JSON.parse(
  fs.readFileSync('.playwright-mcp/decisions-export-2026-01-20.json', 'utf8')
);

const decision = exportData.decisions[0];
const expectedDescription = 'Testing export feature integrity. This is a detailed description about a career decision. Special characters: @#$%^&*()_+-=[]{}|;:\',.<>?/~` Numbers: 1234567890 Unicode: ñ é ü 测试 🎯';

console.log('Expected length:', expectedDescription.length);
console.log('Actual length:', decision.description.length);
console.log('\nExpected:');
console.log(JSON.stringify(expectedDescription));
console.log('\nActual:');
console.log(JSON.stringify(decision.description));

// Find the difference
if (decision.description !== expectedDescription) {
  console.log('\n❌ STRINGS DO NOT MATCH');
  for (let i = 0; i < Math.max(expectedDescription.length, decision.description.length); i++) {
    if (expectedDescription[i] !== decision.description[i]) {
      console.log(`\nDifference at position ${i}:`);
      console.log(`  Expected: "${expectedDescription[i]}" (code: ${expectedDescription.charCodeAt(i)})`);
      console.log(`  Actual: "${decision.description[i]}" (code: ${decision.description.charCodeAt(i)})`);

      // Show context around the difference
      const start = Math.max(0, i - 10);
      const end = Math.min(expectedDescription.length, i + 10);
      console.log(`\n  Expected context: "${expectedDescription.substring(start, end)}"`);
      console.log(`  Actual context: "${decision.description.substring(start, end)}"`);
    }
  }
} else {
  console.log('\n✅ STRINGS MATCH PERFECTLY');
}

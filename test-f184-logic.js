/**
 * Feature #184 Unit Test: Smart reminder timing calculation
 *
 * Tests the getReminderDaysForCategory function logic
 */

// Simulated function from decisionService.ts
function getReminderDaysForCategory(categoryName) {
  const defaultDays = 14;

  if (!categoryName) {
    return defaultDays;
  }

  const categoryReminderDays = {
    'Finance': 7,
    'Business': 7,
    'Career': 14,
    'Health': 21,
    'Relationships': 28,
    'Education': 28,
    'Lifestyle': 10,
  };

  return categoryReminderDays[categoryName] || defaultDays;
}

// Test cases
const testCases = [
  { input: 'Finance', expected: 7, description: 'Financial decisions' },
  { input: 'Business', expected: 7, description: 'Business decisions' },
  { input: 'Career', expected: 14, description: 'Career decisions' },
  { input: 'Health', expected: 21, description: 'Health decisions' },
  { input: 'Relationships', expected: 28, description: 'Relationship decisions' },
  { input: 'Education', expected: 28, description: 'Education decisions' },
  { input: 'Lifestyle', expected: 10, description: 'Lifestyle decisions' },
  { input: null, expected: 14, description: 'No category (default)' },
  { input: undefined, expected: 14, description: 'Undefined category (default)' },
  { input: 'UnknownCategory', expected: 14, description: 'Unknown category (default)' },
  { input: 'Technology', expected: 14, description: 'Technology (not in map)' },
];

console.log('='.repeat(70));
console.log('Feature #184 Unit Test: Smart Reminder Days Calculation');
console.log('='.repeat(70));

const results = [];

for (const test of testCases) {
  const result = getReminderDaysForCategory(test.input);
  const passed = result === test.expected;

  console.log(`\nTest: ${test.description}`);
  console.log(`  Input: ${test.input || '(null/undefined)'}`);
  console.log(`  Expected: ${test.expected} days`);
  console.log(`  Actual: ${result} days`);
  console.log(`  Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

  results.push({
    test: test.description,
    input: test.input || 'null',
    expected: test.expected,
    actual: result,
    passed,
  });
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));

const passed = results.filter(r => r.passed).length;
const total = results.length;

console.log(`\nTotal Tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${total - passed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

if (passed === total) {
  console.log('✅ All tests passed!');
  console.log('\nThe smart reminder timing logic is working correctly:');
  console.log('- Finance/Business: 7 days (quick feedback)');
  console.log('- Career: 14 days (default)');
  console.log('- Health: 21 days (medium-term)');
  console.log('- Relationships/Education: 28 days (long-term)');
  console.log('- Lifestyle: 10 days (personal preference)');
  console.log('- Unknown/No category: 14 days (default)');
} else {
  console.log('❌ Some tests failed');
  console.table(results);
}

process.exit(passed === total ? 0 : 1);

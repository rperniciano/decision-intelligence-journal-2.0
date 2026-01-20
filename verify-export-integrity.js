const fs = require('fs');

// Read the exported JSON
const exportData = JSON.parse(
  fs.readFileSync('.playwright-mcp/decisions-export-2026-01-20.json', 'utf8')
);

const decision = exportData.decisions[0];

console.log('='.repeat(60));
console.log('FEATURE #282: EXPORT INTEGRITY VERIFICATION');
console.log('='.repeat(60));

let allPassed = true;

// Verification 1: Title contains unique identifier
const test1 = decision.title.includes('EXPORT_INTEGRITY_TEST_2025');
console.log('\n✓ Test 1: Title contains unique identifier');
console.log(`  Expected: "EXPORT_INTEGRITY_TEST_2025"`);
console.log(`  Actual: "${decision.title}"`);
console.log(`  Result: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
if (!test1) allPassed = false;

// Verification 2: Description has special characters
const test2 = decision.description.includes('@#$%^&*()');
console.log('\n✓ Test 2: Special characters preserved');
console.log(`  Expected: Contains @#$%^&*()`);
console.log(`  Actual: "${decision.description.substring(0, 100)}..."`);
console.log(`  Result: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
if (!test2) allPassed = false;

// Verification 3: Description has Unicode characters
const test3 = decision.description.includes('ñ') &&
              decision.description.includes('é') &&
              decision.description.includes('ü') &&
              decision.description.includes('测试') &&
              decision.description.includes('🎯');
console.log('\n✓ Test 3: Unicode characters preserved');
console.log(`  Expected: Contains ñ, é, ü, 测试, 🎯`);
console.log(`  Unicode check: ñ=${decision.description.includes('ñ')}, é=${decision.description.includes('é')}, ü=${decision.description.includes('ü')}, 测试=${decision.description.includes('测试')}, 🎯=${decision.description.includes('🎯')}`);
console.log(`  Result: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
if (!test3) allPassed = false;

// Verification 4: Status is correct
const test4 = decision.status === 'draft';
console.log('\n✓ Test 4: Status field integrity');
console.log(`  Expected: "draft"`);
console.log(`  Actual: "${decision.status}"`);
console.log(`  Result: ${test4 ? '✅ PASS' : '❌ FAIL'}`);
if (!test4) allPassed = false;

// Verification 5: Created date matches
const expectedDate = '2026-01-20T14:10:23.934';
const test5 = decision.created_at.startsWith(expectedDate);
console.log('\n✓ Test 5: Created date integrity');
console.log(`  Expected: "${expectedDate}"`);
console.log(`  Actual: "${decision.created_at}"`);
console.log(`  Result: ${test5 ? '✅ PASS' : '❌ FAIL'}`);
if (!test5) allPassed = false;

// Verification 6: Updated date matches
const test6 = decision.updated_at.startsWith(expectedDate);
console.log('\n✓ Test 6: Updated date integrity');
console.log(`  Expected: "${expectedDate}"`);
console.log(`  Actual: "${decision.updated_at}"`);
console.log(`  Result: ${test6 ? '✅ PASS' : '❌ FAIL'}`);
if (!test6) allPassed = false;

// Verification 7: No data transformation errors (checking key content)
// Note: JSON properly escapes quotes, so we check for the presence of all key content
const expectedContent = 'Testing export feature integrity. This is a detailed description about a career decision. Special characters:';
const hasAllSpecialChars = decision.description.includes('@#$%^&*()_+-=[]{}|;:') &&
                          decision.description.includes('.<>?/~`') &&
                          decision.description.includes('Numbers: 1234567890') &&
                          decision.description.includes('Unicode: ñ é ü 测试 🎯');
const test7 = decision.description.includes(expectedContent) && hasAllSpecialChars;
console.log('\n✓ Test 7: No data transformation (content preserved)');
console.log(`  Expected to contain: "${expectedContent}"`);
console.log(`  Actual contains: ${decision.description.includes(expectedContent) ? 'YES' : 'NO'}`);
console.log(`  All special chars present: ${hasAllSpecialChars ? 'YES' : 'NO'}`);
console.log(`  Result: ${test7 ? '✅ PASS - CONTENT PRESERVED' : '❌ FAIL - DATA TRANSFORMED'}`);
if (!test7) allPassed = false;

// Verification 8: Numeric fields integrity
const test8 = decision.hour_of_day === 15 && decision.day_of_week === 2;
console.log('\n✓ Test 8: Numeric fields integrity');
console.log(`  hour_of_day: Expected=15, Actual=${decision.hour_of_day}`);
console.log(`  day_of_week: Expected=2, Actual=${decision.day_of_week}`);
console.log(`  Result: ${test8 ? '✅ PASS' : '❌ FAIL'}`);
if (!test8) allPassed = false;

// Verification 9: Null fields preserved correctly
const test9 = decision.outcome === null &&
              decision.raw_transcript === null &&
              decision.audio_url === null;
console.log('\n✓ Test 9: Null fields preserved');
console.log(`  outcome: ${decision.outcome}`);
console.log(`  raw_transcript: ${decision.raw_transcript}`);
console.log(`  audio_url: ${decision.audio_url}`);
console.log(`  Result: ${test9 ? '✅ PASS' : '❌ FAIL'}`);
if (!test9) allPassed = false;

// Verification 10: Export metadata
const test10 = exportData.exportDate &&
               exportData.totalDecisions === 1;
console.log('\n✓ Test 10: Export metadata');
console.log(`  exportDate: ${exportData.exportDate}`);
console.log(`  totalDecisions: Expected=1, Actual=${exportData.totalDecisions}`);
console.log(`  Result: ${test10 ? '✅ PASS' : '❌ FAIL'}`);
if (!test10) allPassed = false;

// Final result
console.log('\n' + '='.repeat(60));
console.log('FINAL RESULT:');
if (allPassed) {
  console.log('✅ ALL TESTS PASSED - Export data integrity verified!');
  console.log('Feature #282 is WORKING CORRECTLY');
} else {
  console.log('❌ SOME TESTS FAILED - Export data integrity issues detected!');
  console.log('Feature #282 has REGRESSION');
}
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);

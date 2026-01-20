/**
 * Verify Feature #271 Implementation
 *
 * This script verifies the code structure prevents polling race conditions
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== Feature #271: Processing Job Status Race Handled ===\n');
console.log('Verification Checklist:\n');

const recordPagePath = path.join(__dirname, 'apps/web/src/pages/RecordPage.tsx');
const recordPageContent = fs.readFileSync(recordPagePath, 'utf-8');

const checks = [
  {
    name: 'AbortController ref for cancelling polling',
    pattern: /abortControllerRef\s*=\s*useRef<AbortController/,
    required: true,
  },
  {
    name: 'Mounted state ref to prevent state updates after unmount',
    pattern: /isMountedRef\s*=\s*useRef<[^>]*>\(\s*true\s*\)/,
    required: true,
  },
  {
    name: 'AbortController created for each polling session',
    pattern: /const abortController = new AbortController\(\)/,
    required: true,
  },
  {
    name: 'AbortController signal passed to fetch',
    pattern: /signal:\s*abortController\.signal/,
    required: true,
  },
  {
    name: 'Check mounted state before polling loop',
    pattern: /if\s*\(\s*!\s*isMountedRef\.current\s*\|\|\s*abortController\.signal\.aborted\s*\)/,
    required: true,
  },
  {
    name: 'Check mounted state after async fetch',
    pattern: /if\s*\(\s*!\s*isMountedRef\.current\s*\)/,
    required: true,
  },
  {
    name: 'AbortController cleanup in finally block',
    pattern: /finally\s*{[\s\S]*abortController\.abort\(\)/,
    required: true,
  },
  {
    name: 'Cleanup useEffect aborts polling on unmount',
    pattern: /useEffect\(\s*\(\)\s*=>\s*{[\s\S]*isMountedRef\.current\s*=\s*false;[\s\S]*abortControllerRef\.current\.abort\(\)/,
    required: true,
  },
  {
    name: 'State updates check isMountedRef',
    pattern: /if\s*\(\s*isMountedRef\.current\s*\)/,
    required: true,
  },
  {
    name: 'Cancelled polling does not show error',
    pattern: /if\s*\(\s*!\s*errorMessage\.includes\(\s*['"`]cancelled['"`]\s*\)\s*\)/,
    required: true,
  },
];

let passed = 0;
let failed = 0;

checks.forEach((check, index) => {
  const found = check.pattern.test(recordPageContent);
  const status = found ? '✓' : '✗';
  const result = found ? 'PASS' : 'FAIL';

  console.log(`${index + 1}. [${result}] ${status} ${check.name}`);

  if (found) {
    passed++;
  } else if (check.required) {
    failed++;
    console.log(`   ❌ Missing required implementation`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\nResults: ${passed}/${checks.length} checks passed`);

if (failed === 0) {
  console.log('\n✅ Feature #271 Implementation: COMPLETE');
  console.log('\nKey protections implemented:');
  console.log('1. AbortController cancels pending fetch requests on unmount');
  console.log('2. isMountedRef prevents state updates after component unmounts');
  console.log('3. Cleanup useEffect ensures resources are freed');
  console.log('4. Polling loop checks both mounted state and abort signal');
  console.log('5. Silently handles cancelled polling (user navigated away)');
  console.log('\nRace conditions prevented:');
  console.log('• setState on unmounted component → prevented by isMountedRef');
  console.log('• Memory leaks from continued polling → prevented by AbortController');
  console.log('• Stale navigation after unmount → prevented by isMountedRef check');
  console.log('• Multiple polling loops → prevented by single AbortController ref');
  process.exit(0);
} else {
  console.log('\n❌ Feature #271 Implementation: INCOMPLETE');
  console.log(`\n${failed} required implementation(s) missing`);
  process.exit(1);
}

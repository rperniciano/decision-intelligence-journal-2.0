const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing Feature #253: Reduce motion setting respected\n');

  // Test 1: Normal motion
  console.log('Test 1: Normal mode');
  await page.goto('http://localhost:5173/');

  const normalState = await page.evaluate(() => {
    const grain = document.querySelector('.grain-overlay');
    return {
      grainOverlay: grain ? window.getComputedStyle(grain).display : 'not found',
      prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  });

  console.log('  - Grain overlay:', normalState.grainOverlay);
  console.log('  - System prefers reduced motion:', normalState.prefersReduced);

  // Test 2: Reduced motion
  console.log('\nTest 2: Reduced motion mode');
  await context.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();

  const reducedState = await page.evaluate(() => {
    const grain = document.querySelector('.grain-overlay');
    const body = document.body;
    const bodyStyle = window.getComputedStyle(body);

    return {
      grainOverlay: grain ? window.getComputedStyle(grain).display : 'not found',
      bodyAnimationDuration: bodyStyle.animationDuration,
      bodyTransitionDuration: bodyStyle.transitionDuration,
      prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  });

  console.log('  - Grain overlay:', reducedState.grainOverlay);
  console.log('  - Animation duration:', reducedState.bodyAnimationDuration);
  console.log('  - Transition duration:', reducedState.bodyTransitionDuration);
  console.log('  - System prefers reduced motion:', reducedState.prefersReduced);

  // Test 3: Verify content is still accessible
  console.log('\nTest 3: Essential info still conveyed');
  const contentCheck = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const p = document.querySelector('p');
    const buttons = document.querySelectorAll('button');

    return {
      hasHeading: !!h1,
      headingText: h1 ? h1.textContent : 'none',
      hasParagraph: !!p,
      buttonCount: buttons.length
    };
  });

  console.log('  - Heading present:', contentCheck.hasHeading);
  console.log('  - Heading text:', contentCheck.headingText);
  console.log('  - Paragraph present:', contentCheck.hasParagraph);
  console.log('  - Buttons available:', contentCheck.buttonCount);

  // Test 4: Verify usability
  console.log('\nTest 4: Usable without motion');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(500);
  const currentUrl = page.url();
  console.log('  - Navigation works:', currentUrl.includes('/login'));

  // Results
  console.log('\n=== RESULTS ===');
  const tests = [
    {
      name: 'Animations reduced',
      passed: reducedState.grainOverlay === 'none' ||
              reducedState.bodyAnimationDuration === '0.01ms' ||
              reducedState.bodyAnimationDuration === '0s'
    },
    {
      name: 'Grain overlay hidden',
      passed: reducedState.grainOverlay === 'none'
    },
    {
      name: 'Essential info conveyed',
      passed: contentCheck.hasHeading && contentCheck.hasParagraph && contentCheck.buttonCount > 0
    },
    {
      name: 'Usable without motion',
      passed: currentUrl.includes('/login')
    }
  ];

  let allPassed = true;
  tests.forEach(test => {
    console.log(`${test.passed ? '✓' : '✗'} ${test.name}`);
    if (!test.passed) allPassed = false;
  });

  console.log('\n' + (allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'));

  await browser.close();
  process.exit(allPassed ? 0 : 1);
})();

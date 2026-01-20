const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  console.log('Logging in...');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'test_f161_rapid_delete@example.com');
  await page.fill('input[type="password"]', 'Test1234');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('http://localhost:5173/dashboard');

  // Navigate to decision
  console.log('Navigating to decision...');
  await page.goto('http://localhost:5173/decisions/dd4c4634-def5-4494-8561-188590cdfb75');
  await page.waitForLoadState('networkidle');

  // Take screenshot before clicking
  await page.screenshot({ path: 'test-f161-before-rapid-clicks.png' });
  console.log('Screenshot taken: test-f161-before-rapid-clicks.png');

  // Rapidly click Delete button 10 times
  console.log('Rapidly clicking Delete button 10 times...');
  const deleteButton = page.getByRole('button', { name: 'Delete' });

  for (let i = 0; i < 10; i++) {
    await deleteButton.click();
    // Very small delay between clicks (50ms)
    await page.waitForTimeout(50);
  }

  // Wait for modals to render
  await page.waitForTimeout(500);

  // Check for multiple modals
  const modalCount = await page.locator('role=dialog').count();
  console.log(`Number of modals found: ${modalCount}`);

  // Check for multiple "Delete Decision" headings
  const headingCount = await page.locator('h2:has-text("Delete Decision")').count();
  console.log(`Number of "Delete Decision" headings found: ${headingCount}`);

  // Take screenshot after rapid clicks
  await page.screenshot({ path: 'test-f161-after-rapid-clicks.png' });
  console.log('Screenshot taken: test-f161-after-rapid-clicks.png');

  // Result
  if (modalCount === 1 && headingCount === 1) {
    console.log('✅ PASS: Only one modal appeared (idempotent behavior)');
  } else {
    console.log('❌ FAIL: Multiple modals appeared - NOT idempotent');
  }

  await browser.close();
})();

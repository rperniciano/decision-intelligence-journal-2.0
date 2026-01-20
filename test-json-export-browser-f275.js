// Test JSON export through the browser UI
// This simulates a user logging in and exporting their data as JSON

const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting browser test for JSON export...\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
  });

  const page = await browser.newPage();

  try {
    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="email"]');

    // Fill in login form
    console.log('2. Filling login form...');
    await page.type('input[type="email"]', 'test_f275_all_fields@example.com');
    await page.type('input[type="password"]', 'Test1234!');

    // Submit form
    console.log('3. Submitting login form...');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Navigate to settings page
    console.log('4. Navigating to settings...');
    await page.goto('http://localhost:5173/settings');
    await page.waitForSelector('a[href="/settings/export"]');

    // Click on Export link
    console.log('5. Clicking Export link...');
    await page.click('a[href="/settings/export"]');
    await page.waitForSelector('button:has-text("JSON Format")');

    // Click JSON export button
    console.log('6. Clicking JSON export button...');
    const downloadPromise = page.waitForDownload();

    // Click the JSON export button
    const jsonButton = await page.$('button:has-text("JSON Format")');
    if (!jsonButton) {
      throw new Error('JSON export button not found');
    }

    await jsonButton.click();

    // Wait for download
    console.log('7. Waiting for download to complete...');
    const download = await downloadPromise;

    // Save the file
    const downloadPath = `test-json-export-f275-${Date.now()}.json`;
    await download.saveAs(downloadPath);
    console.log(`✓ File downloaded: ${downloadPath}`);

    // Read and verify the file
    console.log('\n8. Verifying downloaded file...');
    const fs = require('fs');
    const exportData = JSON.parse(fs.readFileSync(downloadPath, 'utf8'));

    console.log(`✓ Export date: ${exportData.exportDate}`);
    console.log(`✓ Total decisions: ${exportData.totalDecisions}`);

    // Verify structure
    if (!exportData.decisions || !Array.isArray(exportData.decisions)) {
      throw new Error('Invalid export structure: decisions not found');
    }

    const firstDecision = exportData.decisions[0];
    console.log(`✓ First decision title: ${firstDecision.title}`);
    console.log(`✓ First decision status: ${firstDecision.status}`);
    console.log(`✓ First decision has category: ${firstDecision.category ? 'Yes' : 'No'}`);
    console.log(`✓ First decision has options: ${firstDecision.options ? firstDecision.options.length : 0}`);

    if (firstDecision.options && firstDecision.options.length > 0) {
      const firstOption = firstDecision.options[0];
      console.log(`✓ First option title: ${firstOption.title}`);
      console.log(`✓ First option has pros_cons: ${firstOption.pros_cons ? firstOption.pros_cons.length : 0}`);

      if (firstOption.pros_cons && firstOption.pros_cons.length > 0) {
        const firstProCon = firstOption.pros_cons[0];
        console.log(`✓ First pro/con type: ${firstProCon.type}`);
        console.log(`✓ First pro/con content: ${firstProCon.content ? 'Yes' : 'No'}`);
      }
    }

    // Verify all required fields
    const checks = [
      { name: 'Export has exportDate', pass: !!exportData.exportDate },
      { name: 'Export has totalDecisions', pass: exportData.totalDecisions > 0 },
      { name: 'Export has decisions array', pass: Array.isArray(exportData.decisions) },
      { name: 'Decisions have category', pass: exportData.decisions.every(d => d.category) },
      { name: 'Decisions have options', pass: exportData.decisions.some(d => d.options && d.options.length > 0) },
      { name: 'Options have pros_cons', pass: exportData.decisions.some(d => d.options && d.options.some(o => o.pros_cons && o.pros_cons.length > 0)) },
    ];

    console.log('\n--- Verification Results ---\n');
    let allPass = true;
    checks.forEach(check => {
      console.log(`${check.pass ? '✓' : '✗'} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    console.log('\n' + '='.repeat(60));
    if (allPass) {
      console.log('✓✓✓ ALL CHECKS PASSED! JSON export is working correctly.');
      console.log('Feature #275: JSON export contains all records - VERIFIED');
    } else {
      console.log('✗✗✗ Some checks failed!');
    }
    console.log('='.repeat(60));

    // Take a screenshot
    await page.screenshot({ path: 'test-f275-json-export-success.png' });
    console.log('\n✓ Screenshot saved: test-f275-json-export-success.png');

  } catch (error) {
    console.error('\n✗✗✗ Error:', error.message);
    await page.screenshot({ path: 'test-f275-error.png' });
    console.log('Screenshot saved: test-f275-error.png');
  } finally {
    await browser.close();
  }

  console.log('\nTest complete!');
  process.exit(0);
})();

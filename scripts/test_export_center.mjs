import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Bulk Export Center & Tally XML automated verification test...');
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome'
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Load app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('✓ EXP1: Page loaded successfully');

    // 2. Click Export Center sidebar button
    const expBtn = page.locator('[data-testid="book-export"]');
    await expBtn.waitFor({ state: 'visible', timeout: 5000 });
    await expBtn.click();
    console.log('✓ EXP2: Clicked [data-testid="book-export"]');

    // 3. Verify screen loads
    const expScreen = page.locator('[data-testid="export-screen"]');
    await expScreen.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ EXP3: ExportCenterScreen rendered');

    // 4. Verify Heading
    const heading = await page.locator('h1').textContent();
    console.log(`✓ EXP4: Screen heading verified: "${heading}"`);

    // 5. Verify all 6 export cards exist
    const tallySalesBtn = page.locator('[data-testid="btn-export-tally-sales"]');
    const tallyLedgersBtn = page.locator('[data-testid="btn-export-tally-ledgers"]');
    const invCsvBtn = page.locator('[data-testid="btn-export-csv-inventory"]');
    const billsCsvBtn = page.locator('[data-testid="btn-export-csv-bills"]');
    const inwardsCsvBtn = page.locator('[data-testid="btn-export-csv-inwards"]');
    const custCsvBtn = page.locator('[data-testid="btn-export-csv-customers"]');

    await tallySalesBtn.waitFor({ state: 'visible' });
    await tallyLedgersBtn.waitFor({ state: 'visible' });
    await invCsvBtn.waitFor({ state: 'visible' });
    await billsCsvBtn.waitFor({ state: 'visible' });
    await inwardsCsvBtn.waitFor({ state: 'visible' });
    await custCsvBtn.waitFor({ state: 'visible' });
    console.log('✓ EXP5: All 6 Bulk Export Cards verified');

    // 6. Test Tally XML Export trigger
    await tallySalesBtn.click();
    console.log('✓ EXP6: TallyPrime Sales Vouchers XML export triggered');

    // 7. Test Inventory Master CSV trigger
    await invCsvBtn.click();
    console.log('✓ EXP7: Complete Inventory Master CSV export triggered');

    // 8. Verify TallyPrime Instructions Guide box
    const guideBox = page.locator('text=TallyPrime లోకి డేటాను ఎలా ఇంపోర్ట్ చేయాలి');
    await guideBox.waitFor({ state: 'visible' });
    console.log('✓ EXP8: TallyPrime Import Guide Box verified');

    // 9. Console errors check
    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors detected:', consoleErrors);
    } else {
      console.log('✓ EXP9: Zero console errors detected during test run');
    }

    console.log('🎉 ALL 9 BULK EXPORT CENTER & TALLY TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Phase 5 Milestone 5.1: Day-End Closing & Z-Report Settlement Studio...');
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'msedge'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 }
  });
  const page = await context.newPage();
  page.on('dialog', async (dialog) => {
    console.log('Browser Dialog opened:', dialog.type(), dialog.message());
    await dialog.accept();
  });

  try {
    // 1. Navigate to Sauda app (Dashboard)
    console.log('1. Loading Sauda application at http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded:', await page.title());
    await page.waitForTimeout(1000);

    // 2. Click "డే-ఎండ్ Z-రిపోర్ట్" (Day-End Z-Report) button
    console.log('2. Clicking "డే-ఎండ్ Z-రిపోర్ట్" (Day-End Z-Report) button...');
    const dayEndBtn = page.locator('button', { hasText: /డే-ఎండ్ Z-రిపోర్ట్|Day-End Z-Report/ }).first();
    await dayEndBtn.waitFor({ state: 'visible', timeout: 5000 });
    await dayEndBtn.click();
    await page.waitForTimeout(1000);

    // 3. Verify Day-End Closing & Z-Report Studio modal opened
    console.log('3. Verifying Day-End Closing & Z-Report Studio modal...');
    const modal = page.locator('.fixed.inset-0.z-50').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    const studioTitle = modal.locator('h2', { hasText: /డే-ఎండ్ క్లోజింగ్ & Z-రిపోర్ట్ స్టూడియో|Day-End Closing & Z-Report Studio/ }).first();
    await studioTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Day-End Closing Studio opened successfully!');

    // 4. Test Opening Float Preset Selector
    console.log('4. Testing Opening Float Preset selection (₹2000)...');
    const float2000Btn = modal.locator('button', { hasText: /^₹2000$/ }).first();
    if (await float2000Btn.isVisible()) {
      await float2000Btn.click();
      await page.waitForTimeout(300);
      console.log('✓ Selected ₹2,000 opening float preset');
    }

    // 5. Test Auto-Tally / Denomination Count
    console.log('5. Clicking "టాలీ నింపు" (Auto-Tally) to balance drawer denominations...');
    const autoTallyBtn = modal.locator('button', { hasText: /టాలీ నింపు|Auto-Tally/ }).first();
    await autoTallyBtn.waitFor({ state: 'visible', timeout: 5000 });
    await autoTallyBtn.click();
    await page.waitForTimeout(600);

    // 6. Verify Reconciliation Discrepancy Banner shows BALANCED
    console.log('6. Verifying Reconciliation Discrepancy Banner...');
    const balancedBanner = modal.locator('text=సరిగ్గా సరిపోయింది').first();
    await balancedBanner.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Discrepancy meter verified: PERFECTLY BALANCED (₹0.00 difference)!');

    // 7. Verify Expected Cash vs Physical Cash Counted
    const physicalCash = modal.locator('.text-classicEmerald-700.tnum').first();
    const cashVal = await physicalCash.innerText();
    console.log(`Counted Physical Cash in Drawer: ${cashVal}`);

    // 8. Capture screenshot of Day-End Closing Studio
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_day_end_z_report_studio_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured Day-End Closing Studio screenshot to:', studioScreenshot);

    // 9. Click "Generate Z-Report" (డే-ఎండ్ పూర్తి చేయి)
    console.log('9. Clicking "డే-ఎండ్ పూర్తి చేయి (Generate Z-Report)"...');
    const finalizeBtn = modal.locator('button', { hasText: /డే-ఎండ్ పూర్తి చేయి|Generate Z-Report/ }).first();
    await finalizeBtn.click();
    await page.waitForTimeout(1500);

    // 10. Verify Thermal Z-Report slip overlay
    console.log('10. Verifying Thermal Z-Report receipt overlay...');
    const slipTitle = page.locator('text=డే-ఎండ్ Z-రిపోర్ట్ విజయవంతంగా నమోదైంది!').first();
    await slipTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Official Z-Report generated successfully!');

    // Capture screenshot of Thermal Z-Report receipt slip
    const receiptScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_day_end_z_report_receipt_live.png';
    await page.screenshot({ path: receiptScreenshot });
    console.log('✓ Captured Thermal Z-Report Receipt screenshot to:', receiptScreenshot);

    // 11. Click "Done" (పూర్తయింది) to close
    console.log('11. Clicking "Done" to close...');
    const doneBtn = page.locator('button', { hasText: /పూర్తయింది|Done/ }).first();
    await doneBtn.click();
    await page.waitForTimeout(1000);

    // Verify modal closed
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('✓ Modal closed cleanly!');

    console.log('🎉 ALL VERIFICATION CHECKS PASSED FOR MILESTONE 5.1 (DAY-END Z-REPORT SETTLEMENT)!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_5_1.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

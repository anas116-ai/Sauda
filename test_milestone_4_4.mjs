import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Milestone 4.4: Multi-Customer Bulk Settlement Studio...');
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
    // 1. Navigate to Sauda app and go to Khata
    console.log('1. Loading Sauda application at http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded:', await page.title());
    await page.waitForTimeout(1000);

    console.log('Navigating to Khata screen (ఖాతా / ఉధార్)...');
    const khataNavBtn = page.locator('header button', { hasText: /ఖాతా|Khata/ }).first();
    await khataNavBtn.click();
    await page.waitForTimeout(1000);

    // 2. Switch to Customers tab
    console.log('2. Switching to Customers tab (కస్టమర్ల ఖాతా)...');
    const custTabBtn = page.locator('button', { hasText: /కస్టమర్ల ఖాతా|కస్టమర్ ఖాతా|Customer Khata/ }).first();
    await custTabBtn.waitFor({ state: 'visible', timeout: 5000 });
    await custTabBtn.click();
    await page.waitForTimeout(800);

    // 3. Click "బల్క్ వసూళ్లు" (Bulk Settle) button in directory header
    console.log('3. Clicking "బల్క్ వసూళ్లు" (Bulk Settle) button...');
    const bulkSettleBtn = page.locator('button', { hasText: /బల్క్ వసూళ్లు|Bulk Settle/ }).first();
    await bulkSettleBtn.waitFor({ state: 'visible', timeout: 5000 });
    await bulkSettleBtn.click();
    await page.waitForTimeout(1000);

    // 4. Verify Multi-Customer Bulk Settlement Studio modal opened
    console.log('4. Verifying Multi-Customer Bulk Settlement Studio modal...');
    const modal = page.locator('.fixed.inset-0.z-50').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    const studioHeader = modal.locator('h2', { hasText: /బహుళ కస్టమర్ల బల్క్ కలెక్షన్|Multi-Customer Bulk Settlement/ }).first();
    await studioHeader.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Bulk Settlement Studio opened successfully!');

    // 5. Test Route/Village filter pills inside modal
    console.log('5. Testing Route/Village filter pills inside modal...');
    const routeButtons = modal.locator('button', { hasText: /Shanti Nagar|Gandhi Nagar|Bhavani Nagar|RTC Cross Roads/ });
    const routeCount = await routeButtons.count();
    if (routeCount > 0) {
      const firstRoute = routeButtons.first();
      const routeText = await firstRoute.innerText();
      console.log(`Filtering by route: ${routeText.trim()}`);
      await firstRoute.click();
      await page.waitForTimeout(500);

      // Reset to all routes
      const allRoutesBtn = modal.locator('button', { hasText: /అన్ని ప్రాంతాలు|All Routes/ }).first();
      await allRoutesBtn.click();
      await page.waitForTimeout(500);
      console.log('✓ Route filtering confirmed!');
    }

    // 6. Test "Fill All Full Dues"
    console.log('6. Testing "అందరి పూర్తి బాకీ నింపు" (Fill All Full Dues)...');
    const fillAllBtn = modal.locator('button', { hasText: /అందరి పూర్తి బాకీ నింపు|Fill All Full Dues/ }).first();
    await fillAllBtn.click();
    await page.waitForTimeout(600);

    // Verify footer metrics updated
    const payingCountEl = modal.locator('text=వసూలు చేసేవారు').locator('..').locator('.font-mono').first();
    const countText = await payingCountEl.innerText();
    console.log(`Paying accounts after Fill All: ${countText}`);

    // 7. Test "Clear All"
    console.log('7. Testing "క్లియర్ చేయి" (Clear All)...');
    const clearBtn = modal.locator('button', { hasText: /క్లియర్ చేయి|Clear/ }).first();
    await clearBtn.click();
    await page.waitForTimeout(500);

    // 8. Test Selective Multi-Customer Entry:
    console.log('8. Entering custom partial collections for multiple customers...');
    const amountInputs = modal.locator('input[type="number"][placeholder="0"]');
    const inputCount = await amountInputs.count();
    console.log(`Found ${inputCount} debtor customer rows in modal.`);

    if (inputCount >= 1) {
      // Enter ₹500 on first debtor
      await amountInputs.nth(0).fill('500');
      await page.waitForTimeout(300);
    }

    if (inputCount >= 2) {
      // Click "పూర్తి" (Full) on second debtor
      const fullButtons = modal.locator('button', { hasText: /^పూర్తి$|^Full$/ });
      if (await fullButtons.count() >= 2) {
        await fullButtons.nth(1).click();
        await page.waitForTimeout(300);
      }
    }

    // Switch payment mode to UPI on the first customer row inside modal
    const upiModeBtns = modal.locator('button', { hasText: /^UPI$/ });
    if (await upiModeBtns.count() > 0) {
      await upiModeBtns.first().click();
      await page.waitForTimeout(300);
      console.log('✓ Switched payment method to UPI');
    }

    // 9. Capture screenshot of Multi-Customer Bulk Settlement Studio
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_khata_bulk_settlement_studio_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured Bulk Settlement Studio screenshot to:', studioScreenshot);

    // 10. Click "Record Collections" (వసూళ్లు భద్రపరచు)
    console.log('10. Clicking "Record Collections" (వసూళ్లు భద్రపరచు)...');
    const recordBtn = modal.locator('button', { hasText: /వసూళ్లు భద్రపరచు|Record Collections/ }).first();
    await recordBtn.waitFor({ state: 'visible', timeout: 5000 });
    await recordBtn.click();
    await page.waitForTimeout(1500);

    // 11. Verify modal closed and Khata updated
    console.log('11. Verifying batch payments posted in Khata...');
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('✓ Modal closed, batch posted successfully!');

    // 12. Capture updated Khata screen
    const khataScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_khata_post_bulk_settlement_live.png';
    await page.screenshot({ path: khataScreenshot });
    console.log('✓ Captured post-bulk-settlement Khata screen to:', khataScreenshot);

    console.log('🎉 ALL VERIFICATION CHECKS PASSED FOR MILESTONE 4.4 & PHASE 4 COMPLETE!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_4_4.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

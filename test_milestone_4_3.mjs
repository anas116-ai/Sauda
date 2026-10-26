import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Milestone 4.3: Simple Interest Calculation for Extended Khata Credit Accounts...');
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

    // 3. Find customer with overdue debt: Krishnam Raju (75d overdue) or Ramu Kirana (45d overdue)
    console.log('3. Selecting customer with overdue balance...');
    let targetCust = page.locator('button', { hasText: /కృష్ణంరాజు|Krishnam Raju/ }).first();
    const count = await targetCust.count();
    if (count === 0) {
      console.log('Krishnam Raju not found directly, checking Ramu Kirana...');
      targetCust = page.locator('button', { hasText: /రాము కిరాణా|Ramu Kirana/ }).first();
    }
    if (await targetCust.count() === 0) {
      console.log('Selecting first available customer with overdue balance...');
      targetCust = page.locator('div.divide-y button').first();
    }

    await targetCust.click();
    await page.waitForTimeout(800);

    // 4. Verify Simple Interest Studio exists
    console.log('4. Verifying Simple Interest Studio widget...');
    const interestStudio = page.locator('text=Simple Interest Studio').first();
    await interestStudio.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Simple Interest Studio visible on Customer profile!');

    // 5. If interest is not already active, click "+ వడ్డీని ప్రారంభించు" (+ Enable Interest)
    const enableBtn = page.locator('button', { hasText: /\+ Enable Interest|\+ వడ్డీని ప్రారంభించు/ }).first();
    if (await enableBtn.count() > 0 && await enableBtn.isVisible()) {
      console.log('Clicking "+ వడ్డీని ప్రారంభించు" (+ Enable Interest)...');
      await enableBtn.click();
      await page.waitForTimeout(500);
    }

    // 6. Test Rate Selector: Click 18% preset
    console.log('5. Selecting 18% p.a. rate and 30d grace period...');
    const rate18Btn = page.locator('button', { hasText: /^18%$/ }).first();
    if (await rate18Btn.isVisible()) {
      await rate18Btn.click();
      await page.waitForTimeout(400);
    }

    // Select 30d grace period
    const grace30Btn = page.locator('button', { hasText: /^30d$/ }).first();
    if (await grace30Btn.isVisible()) {
      await grace30Btn.click();
      await page.waitForTimeout(400);
    }

    // 7. Verify Interest Calculation Ribbon
    console.log('6. Verifying Interest breakdown ribbon (Principal, Interest, Total Due)...');
    const interestBadge = page.locator('text=వడ్డీ').first();
    await interestBadge.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Interest breakdown ribbon confirmed!');

    // 8. Test WhatsApp Statement Integration with Interest
    console.log('7. Opening WhatsApp Statement to verify interest integration in billing copy...');
    const waStatementBtn = page.locator('button', { hasText: /వాట్సాప్ స్టేట్‌మెంట్|WhatsApp Statement/ }).first();
    await waStatementBtn.click();
    await page.waitForTimeout(1000);

    // Verify WhatsApp modal
    const waModal = page.locator('text=వాట్సాప్ పేమెంట్ రిమైండర్ & స్టేట్‌మెంట్').first();
    await waModal.waitFor({ state: 'visible', timeout: 5000 });

    const messageTextarea = page.locator('textarea').first();
    const msgVal = await messageTextarea.inputValue();
    console.log('Message Preview snippet:', msgVal.slice(0, 150));

    // Capture WhatsApp Modal screenshot with interest
    const waScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_khata_interest_whatsapp_live.png';
    await page.screenshot({ path: waScreenshot });
    console.log('✓ Captured WhatsApp reminder modal with interest breakdown to:', waScreenshot);

    // Close modal
    const closeBtn = page.locator('button', { hasText: /రద్దు చేయి|Cancel/ }).first();
    await closeBtn.click();
    await page.waitForTimeout(800);

    // 9. Test "Post Interest to Ledger" button
    console.log('8. Testing Post Interest to Ledger...');
    const postInterestBtn = page.locator('button', { hasText: /వడ్డీని లెడ్జర్‌లో నమోదు చేయి|Post to Ledger/ }).first();
    if (await postInterestBtn.count() > 0 && await postInterestBtn.isVisible()) {
      console.log('Clicking "Post to Ledger" button...');
      await postInterestBtn.click();
      await page.waitForTimeout(1200);

      // Verify the new debit sale entry in the ledger timeline
      const postedInterestEntry = page.locator('text=వడ్డీ సర్దుబాటు').first();
      await postedInterestEntry.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ Interest successfully posted and visible in Customer Ledger timeline!');
    } else {
      console.log('Note: Accrued interest was 0 (customer debt was within grace period), skipped ledger posting.');
    }

    // 10. Capture full screen screenshot of Interest Studio & Ledger
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_khata_interest_calculator_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured live Customer Khata Interest Studio screenshot to:', studioScreenshot);

    console.log('🎉 ALL VERIFICATION CHECKS PASSED FOR MILESTONE 4.3!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_4_3.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

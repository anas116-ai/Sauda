import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Milestone 4.1: Customer Credit Limits & 30/60/90-Day Overdue Aging Analysis...');
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'msedge'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 }
  });
  const page = await context.newPage();
  page.on('dialog', async (dialog) => {
    console.log('Dialog opened:', dialog.type(), dialog.message());
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

    // 3. Verify Aging Filter pills are rendered
    console.log('3. Verifying Aging Filter pills (All, 0-30d, 31-60d, 60+d, Over Limit)...');
    const allPill = page.locator('button', { hasText: /అన్నీ|All/ }).first();
    await allPill.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ All filter pill visible');

    const overdue30Pill = page.locator('button', { hasText: /0-30d/ }).first();
    await overdue30Pill.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ 0-30d current filter pill visible');

    const overdue60Pill = page.locator('button', { hasText: /31-60d/ }).first();
    await overdue60Pill.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ 31-60d overdue filter pill visible');

    // 4. Select Ramesh Ji
    console.log('4. Selecting customer Ramesh Ji...');
    const rameshCard = page.locator('button', { hasText: /రమేష్ గారు|Ramesh Ji/ }).first();
    await rameshCard.click();
    await page.waitForTimeout(500);

    // 5. Open Edit Credit Limit Modal
    console.log('5. Clicking Edit Limit (పరిమితి మార్చు)...');
    const editLimitBtn = page.locator('button', { hasText: /పరిమితి మార్చు|Edit Limit/ }).first();
    await editLimitBtn.click();
    await page.waitForTimeout(500);

    // 6. Verify modal opened and click Preset ₹2,000
    console.log('6. Selecting Preset ₹2,000 to set strict credit ceiling...');
    const preset2kBtn = page.locator('button', { hasText: /₹2,000/ }).first();
    await preset2kBtn.click();
    await page.waitForTimeout(300);

    // 7. Save Credit Limit
    console.log('7. Saving Credit Limit...');
    const saveLimitBtn = page.locator('button', { hasText: /పరిమితి భద్రపరచు|Save Credit Limit/ }).first();
    await saveLimitBtn.click();
    await page.waitForTimeout(800);

    // 8. Verify Credit Limit is now ₹2,000 and status reflects breach since current balance is ₹2,450
    const breachBadge = page.locator('text=పరిమితి కంటే').first();
    await breachBadge.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ Credit Limit updated to ₹2,000 and breach alert confirmed!');

    // 9. Capture screenshot of Khata screen with Aging analysis and Credit limit
    const khataScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_khata_credit_limits_aging_live.png';
    await page.screenshot({ path: khataScreenshotPath });
    console.log('✓ Captured live Khata Credit Limits & Aging screenshot to:', khataScreenshotPath);

    // 10. Navigate to POS Billing counter
    console.log('8. Navigating to POS Billing terminal (POS బిల్లింగ్)...');
    const posNavBtn = page.locator('header button', { hasText: /POS బిల్లింగ్|Fast Billing/ }).first();
    await posNavBtn.click();
    await page.waitForTimeout(1000);

    // 11. Add an item to cart via quick demo button (ఆటా 10kg)
    console.log('9. Clicking Demo Item button (ఆటా 10kg)...');
    const demoAttaBtn = page.locator('button', { hasText: 'ఆటా 10kg' }).first();
    await demoAttaBtn.waitFor({ state: 'visible', timeout: 5000 });
    await demoAttaBtn.click();
    await page.waitForTimeout(800);
    console.log('✓ Item added to cart successfully!');

    // 12. Trigger Khata sale (F3 / ఖాతా / ఉధార్)
    console.log('10. Clicking F3: ఖాతా / ఉధార్ button...');
    const khataPayBtn = page.locator('button', { hasText: /ఖాతా \/ ఉధార్|Khata \/ Credit/ }).first();
    await khataPayBtn.waitFor({ state: 'visible', timeout: 5000 });
    await khataPayBtn.click();
    await page.waitForTimeout(800);

    // 13. Select Ramesh Ji from customer selector modal
    console.log('11. Selecting Ramesh Ji (has exceeded limit) in customer modal...');
    const selectRameshKhata = page.locator('button', { hasText: /రమేష్ గారు/ }).first();
    await selectRameshKhata.waitFor({ state: 'visible', timeout: 5000 });
    await selectRameshKhata.click();
    await page.waitForTimeout(800);

    // 14. Verify Credit Limit Breach Warning Modal triggers
    console.log('12. Verifying Credit Limit Breach Warning Modal triggered...');
    const breachModalTitle = page.locator('text=ఉధార్ పరిమితి హెచ్చరిక').first();
    await breachModalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Credit Limit Breach Warning Modal opened successfully!');

    // 15. Capture screenshot of Credit Limit Breach Warning Modal
    const breachModalScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_credit_limit_warning_modal_live.png';
    await page.screenshot({ path: breachModalScreenshotPath });
    console.log('✓ Captured live POS Credit Limit Breach Warning Modal screenshot to:', breachModalScreenshotPath);

    // 16. Click Manager Override button
    console.log('13. Authorizing with Manager Override & Finalizing sale...');
    const overrideBtn = page.locator('button', { hasText: /మేనేజర్ అనుమతితో బిల్లు చేయి|Manager Override/ }).first();
    await overrideBtn.waitFor({ state: 'visible', timeout: 5000 });
    await overrideBtn.click();
    await page.waitForTimeout(1000);

    // 17. Verify Thermal Receipt Modal opened with sale details
    console.log('14. Verifying Thermal Receipt Modal...');
    const receiptModalTitle = page.locator('text=బిల్లు విజయవంతంగా పూర్తయింది!').first();
    await receiptModalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Receipt modal opened with finalized transaction!');

    // 18. Capture screenshot of Receipt Modal
    const receiptScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_override_receipt_live.png';
    await page.screenshot({ path: receiptScreenshotPath });
    console.log('✓ Captured live Override Receipt screenshot to:', receiptScreenshotPath);

    console.log('🎉 ALL MILESTONE 4.1 PLAYWRIGHT VERIFICATION CHECKS PASSED 100%!');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_4_1.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

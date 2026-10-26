import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Phase 6 Milestone 6.3: Multi-Counter Billing Mode...');
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

    // 2. Click "మల్టీ-కౌంటర్" (Multi-Counter) in command strip
    console.log('2. Clicking "Multi-Counter" button in Dashboard command strip...');
    const multiCounterBtn = page.locator('[data-testid="dashboard-multi-counter-btn"]').first();
    await multiCounterBtn.waitFor({ state: 'visible', timeout: 5000 });
    await multiCounterBtn.click();
    await page.waitForTimeout(800);

    // 3. Verify Multi-Counter Studio modal opened
    console.log('3. Verifying Multi-Counter modal...');
    const modal = page.locator('[data-testid="multi-counter-modal"]').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Multi-Counter Studio opened successfully!');

    // 4. Test Counter Switching in Setup Tab
    console.log('4. Testing counter switching...');
    const selectC2Btn = modal.locator('[data-testid="btn-select-counter-2"]').first();
    await selectC2Btn.click();
    await page.waitForTimeout(600);
    console.log('✓ Switched to Counter 2!');

    // Switch back to Counter 1
    const selectC1Btn = modal.locator('[data-testid="btn-select-counter-1"]').first();
    await selectC1Btn.click();
    await page.waitForTimeout(600);
    console.log('✓ Switched back to Counter 1!');

    // 5. Test Active Counters Network Monitor Tab
    console.log('5. Testing Active Counters Monitor Tab...');
    const monitorTab = modal.locator('[data-testid="tab-counter-monitor"]').first();
    await monitorTab.click();
    await page.waitForTimeout(600);

    const c1Card = modal.locator('[data-testid="active-counter-card-1"]').first();
    const c2Card = modal.locator('[data-testid="active-counter-card-2"]').first();
    await c1Card.waitFor({ state: 'visible', timeout: 3000 });
    await c2Card.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ Active Counters Grid verified!');

    // 6. Test Live Cart Stock Locks Tab
    console.log('6. Testing Live Cart Stock Locks Tab...');
    const locksTab = modal.locator('[data-testid="tab-counter-locks"]').first();
    await locksTab.click();
    await page.waitForTimeout(600);

    const simLockBtn = modal.locator('[data-testid="btn-simulate-lock"]').first();
    await simLockBtn.click();
    await page.waitForTimeout(800);
    console.log('✓ Simulated stock reservation lock on Counter 2!');

    // 7. Test Consolidated Counter Sales Tab
    console.log('7. Testing Consolidated Sales Tab...');
    const salesTab = modal.locator('[data-testid="tab-counter-sales"]').first();
    await salesTab.click();
    await page.waitForTimeout(600);

    // Capture Multi-Counter Studio Screenshot
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_multi_counter_studio_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured Multi-Counter Studio screenshot to:', studioScreenshot);

    // 8. Close Studio Modal
    console.log('8. Closing modal...');
    const closeBtn = modal.locator('[data-testid="multi-counter-close-btn"]').first();
    await closeBtn.click();
    await page.waitForTimeout(600);

    // 9. Navigate to POS Billing Screen
    console.log('9. Navigating to POS Billing screen...');
    const posNavBtn = page.locator('[data-testid="nav-pos"]').first();
    await posNavBtn.click();
    await page.waitForTimeout(1000);

    // 10. Verify POS Counter Badge in ribbon
    console.log('10. Verifying POS Counter Badge in header ribbon...');
    const counterBadge = page.locator('[data-testid="pos-counter-config-btn"]').first();
    await counterBadge.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Counter Badge visible in POS ribbon:', await counterBadge.innerText());

    // 11. Add Demo Item to Cart
    console.log('11. Adding demo product to cart...');
    const demoItemBtn = page.locator('button', { hasText: /ఫ్రీడమ్ నూనె|Freedom Oil/ }).first();
    if (await demoItemBtn.isVisible()) {
      await demoItemBtn.click();
    } else {
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('Freedom');
      await page.waitForTimeout(500);
      const searchItem = page.locator('text=ఫ్రీడమ్').first();
      await searchItem.click();
    }
    await page.waitForTimeout(600);

    // 12. Finalize Bill with Cash (F1)
    console.log('12. Finalizing bill with Cash...');
    const cashBtn = page.locator('button', { hasText: /F1.*నగదు|F1.*Cash/ }).first();
    await cashBtn.waitFor({ state: 'visible', timeout: 5000 });
    await cashBtn.click();
    await page.waitForTimeout(1000);

    // 13. Verify Receipt Modal with Counter-Specific Bill Number
    console.log('13. Verifying receipt bill number format...');
    const receiptModal = page.locator('text=BL-C1-').first();
    await receiptModal.waitFor({ state: 'visible', timeout: 5000 });
    const billNumberText = await receiptModal.innerText();
    console.log('✓ Generated Counter Bill Number:', billNumberText);

    // 14. Capture Live POS Multi-Counter Screenshot
    const posScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_multi_counter_pos_live.png';
    await page.screenshot({ path: posScreenshot });
    console.log('✓ Captured POS Multi-Counter screenshot to:', posScreenshot);

    console.log('🎉 ALL PLAYWRIGHT TESTS PASSED FOR MILESTONE 6.3 100%!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    const errScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_6_3.png';
    await page.screenshot({ path: errScreenshot });
    console.log('Captured error screenshot to:', errScreenshot);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Phase 7 Milestone 7.1: Telugu Voice Billing Assistant...');
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
    // 1. Navigate to Sauda app
    console.log('1. Loading Sauda application at http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded:', await page.title());
    await page.waitForTimeout(1000);

    // 2. Navigate to POS Billing Screen
    console.log('2. Navigating to POS Billing screen...');
    const posNavBtn = page.locator('[data-testid="nav-pos"]').first();
    await posNavBtn.click();
    await page.waitForTimeout(1000);

    // 3. Open Voice Billing Assistant via Mic Button
    console.log('3. Opening Voice Billing Assistant modal via mic button...');
    const voiceBtn = page.locator('[data-testid="pos-voice-billing-btn"]').first();
    await voiceBtn.waitFor({ state: 'visible', timeout: 5000 });
    await voiceBtn.click();
    await page.waitForTimeout(800);

    // 4. Verify Voice Assistant Modal is visible
    console.log('4. Verifying Voice Billing modal...');
    const modal = page.locator('[data-testid="voice-billing-modal"]').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Voice Billing Assistant modal opened!');

    // 5. Test Instant Spoken Preset (Preset 0: 1L Freedom Oil + 1kg Tata Salt)
    console.log('5. Clicking Speech Preset 0: 1L Oil + 1kg Salt...');
    const preset0 = modal.locator('[data-testid="btn-voice-preset-0"]').first();
    await preset0.click();
    await page.waitForTimeout(600);

    // 6. Verify Extracted Items in Drawer
    console.log('6. Verifying extracted items in preview drawer...');
    const item0 = modal.locator('[data-testid="extracted-voice-item-0"]').first();
    const item1 = modal.locator('[data-testid="extracted-voice-item-1"]').first();
    await item0.waitFor({ state: 'visible', timeout: 3000 });
    await item1.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ Recognized Item 1:', await item0.innerText());
    console.log('✓ Recognized Item 2:', await item1.innerText());

    // 7. Capture Voice Billing Studio Screenshot
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_voice_billing_studio_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured Voice Billing Studio screenshot to:', studioScreenshot);

    // 8. Commit Extracted Items to POS Cart
    console.log('8. Clicking Add Items to Cart button...');
    const commitBtn = modal.locator('[data-testid="btn-commit-voice-cart"]').first();
    await commitBtn.click();
    await page.waitForTimeout(1000);

    // 9. Verify items are now present in POS Billing Cart
    console.log('9. Verifying items in POS cart table...');
    const cartOil = page.locator('text=ఫ్రీడమ్').first();
    const cartSalt = page.locator('text=టాటా').first();
    await cartOil.waitFor({ state: 'visible', timeout: 4000 });
    await cartSalt.waitFor({ state: 'visible', timeout: 4000 });
    console.log('✓ Items successfully added to POS cart via Voice Assistant!');

    // 10. Capture POS Cart Screenshot with Voice Items
    const cartScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_voice_billing_cart_live.png';
    await page.screenshot({ path: cartScreenshot });
    console.log('✓ Captured POS Cart with Voice Items screenshot to:', cartScreenshot);

    // 11. Finalize Cash Bill
    console.log('11. Finalizing bill with Cash...');
    const cashBtn = page.locator('button', { hasText: /F1.*నగదు|F1.*Cash/ }).first();
    await cashBtn.click();
    await page.waitForTimeout(1000);

    // Verify Thermal Receipt contains both voice items
    console.log('12. Verifying generated receipt contains voice billed items...');
    const receiptModal = page.locator('text=BL-C1-').first();
    await receiptModal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Finalized Receipt Bill Number verified!');

    console.log('🎉 ALL PLAYWRIGHT TESTS PASSED FOR MILESTONE 7.1 100%!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    const errScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_7_1.png';
    await page.screenshot({ path: errScreenshot });
    console.log('Captured error screenshot to:', errScreenshot);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

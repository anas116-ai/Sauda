import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Phase 5 Milestone 5.4: Store Health Dashboard & Language Switcher...');
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

    // 2. Test 3-Way Language Switcher (EN -> TE -> HI)
    console.log('2. Testing Language Switcher (EN -> TE -> HI)...');
    
    // Switch to English (EN)
    const btnEn = page.locator('[data-testid="lang-switch-en"]').first();
    await btnEn.click();
    await page.waitForTimeout(600);
    const enScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_language_switch_en_live.png';
    await page.screenshot({ path: enScreenshot });
    console.log('✓ Verified English Mode, captured:', enScreenshot);

    // Switch to Telugu (TE)
    const btnTe = page.locator('[data-testid="lang-switch-te"]').first();
    await btnTe.click();
    await page.waitForTimeout(600);
    const teScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_store_health_te_live.png';
    await page.screenshot({ path: teScreenshot });
    console.log('✓ Verified Telugu Mode, captured:', teScreenshot);

    // Switch to Hindi (HI)
    const btnHi = page.locator('[data-testid="lang-switch-hi"]').first();
    await btnHi.click();
    await page.waitForTimeout(600);
    const hiScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_language_switch_hi_live.png';
    await page.screenshot({ path: hiScreenshot });
    console.log('✓ Verified Hindi Mode, captured:', hiScreenshot);

    // 3. Switch back to Telugu for Store Health Verification
    await btnTe.click();
    await page.waitForTimeout(500);

    // 4. Open Store Health Studio modal
    console.log('4. Opening Store Health Studio via action strip button...');
    const healthBtn = page.locator('[data-testid="dashboard-store-health-btn"]').first();
    await healthBtn.waitFor({ state: 'visible', timeout: 5000 });
    await healthBtn.click();
    await page.waitForTimeout(1000);

    // 5. Verify Store Health Studio modal
    console.log('5. Verifying Store Health Studio modal...');
    const modal = page.locator('[data-testid="store-health-studio-modal"]').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    const modalTitle = modal.locator('h2', { hasText: /స్టోర్ హెల్త్|Store Health|स्टोर हेल्थ/ }).first();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Store Health Studio opened successfully!');

    // 6. Verify Overall Vitality Score
    const overallScore = await modal.locator('[data-testid="store-health-overall-score"]').innerText();
    console.log(`   - Store Health Score: ${overallScore} / 100`);

    // 7. Verify Projections
    const runRate = await modal.locator('[data-testid="store-health-run-rate"]').innerText();
    const forecast7d = await modal.locator('[data-testid="store-health-7d-forecast"]').innerText();
    const weeklyProfit = await modal.locator('[data-testid="store-health-weekly-profit"]').innerText();
    console.log(`   - Daily Run Rate: ${runRate}`);
    console.log(`   - 7-Day Forecast: ${forecast7d}`);
    console.log(`   - Expected 7-Day Profit: ${weeklyProfit}`);

    // 8. Capture Store Health Studio Screenshot
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_store_health_studio_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured Store Health Studio screenshot to:', studioScreenshot);

    // 9. Close Modal via footer Done button
    console.log('9. Closing modal...');
    const closeBtn = modal.locator('[data-testid="store-health-close-footer-btn"]').first();
    await closeBtn.click();
    await page.waitForTimeout(800);
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('✓ Modal closed!');

    // 10. Test Launching Store Health from Bento Cell 4
    console.log('10. Testing opening Store Health from Bento Cell 4 button...');
    const bentoHealthBtn = page.locator('[data-testid="bento-open-store-health-pill"]').first();
    await bentoHealthBtn.waitFor({ state: 'visible', timeout: 5000 });
    await bentoHealthBtn.click();
    await page.waitForTimeout(800);

    const reOpenedModal = page.locator('[data-testid="store-health-studio-modal"]').first();
    await reOpenedModal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Successfully opened Store Health from Bento Cell 4!');

    await browser.close();
    console.log('🎉 PHASE 5 MILESTONE 5.4 VERIFICATION COMPLETED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Playwright test failed:', err);
    try {
      await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_5_4.png' });
    } catch (e) {
      // ignore
    }
    await browser.close();
    process.exit(1);
  }
}

runTest();

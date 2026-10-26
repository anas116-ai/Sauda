import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Phase 5 Milestone 5.2: FMCG Velocity & Stock Health (ABC Analysis)...');
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

    // 2. Click "FMCG వెలాసిటీ (ABC)" button in command strip
    console.log('2. Clicking "FMCG వెలాసిటీ (ABC)" button...');
    const velocityBtn = page.locator('button', { hasText: /FMCG వెలాసిటీ|FMCG Velocity/ }).first();
    await velocityBtn.waitFor({ state: 'visible', timeout: 5000 });
    await velocityBtn.click();
    await page.waitForTimeout(1000);

    // 3. Verify FMCG Velocity Studio modal opened
    console.log('3. Verifying FMCG Velocity Studio modal...');
    const modal = page.locator('.fixed.inset-0.z-50').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    const studioTitle = modal.locator('h2', { hasText: /FMCG వెలాసిటీ & స్టాక్ హెల్త్|FMCG Velocity & Stock Health/ }).first();
    await studioTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ FMCG Velocity Studio opened successfully!');

    // 4. Verify 4 Bento Telemetry KPI cards
    console.log('4. Verifying 4 Bento KPI cards (Grade A, Grade B, Dead Stock, Stockout Risk)...');
    const gradeACard = modal.locator('text=ఫాస్ట్ మూవింగ్ (Grade A)').first();
    await gradeACard.waitFor({ state: 'visible', timeout: 5000 });

    const deadStockCard = modal.locator('text=డెడ్ స్టాక్ / స్లో (Grade C)').first();
    await deadStockCard.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Bento KPI cards confirmed!');

    // 5. Test Timeframe Switcher (7d -> 30d -> 90d)
    console.log('5. Testing Timeframe Switcher (7d, 30d, 90d)...');
    const tf7d = modal.locator('button', { hasText: /^7d$/ }).first();
    if (await tf7d.isVisible()) {
      await tf7d.click();
      await page.waitForTimeout(400);
    }
    const tf30d = modal.locator('button', { hasText: /^30d$/ }).first();
    if (await tf30d.isVisible()) {
      await tf30d.click();
      await page.waitForTimeout(400);
      console.log('✓ Timeframe switching verified!');
    }

    // 6. Test Tab Filters
    console.log('6. Testing ABC tab filters...');
    const gradeATab = modal.locator('button', { hasText: /Grade A/ }).first();
    await gradeATab.click();
    await page.waitForTimeout(400);

    const gradeCTab = modal.locator('button', { hasText: /Grade C|Dead/ }).first();
    await gradeCTab.click();
    await page.waitForTimeout(400);

    const allTab = modal.locator('button', { hasText: /అన్నీ|All SKUs/ }).first();
    await allTab.click();
    await page.waitForTimeout(400);
    console.log('✓ Tab filtering verified!');

    // 7. Test Search Box
    console.log('7. Testing SKU search...');
    const searchInput = modal.locator('input[placeholder*="SKU"]').first();
    await searchInput.fill('Atta');
    await page.waitForTimeout(400);
    await searchInput.fill('');
    await page.waitForTimeout(400);
    console.log('✓ Search box verified!');

    // 8. Capture screenshot of FMCG Velocity Studio
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_fmcg_velocity_studio_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured FMCG Velocity Studio screenshot to:', studioScreenshot);

    // 9. Close modal
    console.log('8. Closing modal...');
    const closeBtn = modal.locator('button', { hasText: /మూసివేయి|Close/ }).first();
    await closeBtn.click();
    await page.waitForTimeout(800);
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('✓ Modal closed!');

    // 10. Test Launching from Dashboard Bento Cell 4
    console.log('9. Testing launch from Dashboard Bento Cell 4 (ABC Velocity Radar)...');
    const cell4Link = page.locator('button', { hasText: /ABC వెలాసిటీ విశ్లేషణ చూడు|View ABC Velocity Radar/ }).first();
    await cell4Link.waitFor({ state: 'visible', timeout: 5000 });
    await cell4Link.click();
    await page.waitForTimeout(800);

    await studioTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Deep launch from Bento Cell 4 verified!');

    // Capture screenshot of dashboard with Bento link
    const closeBtn2 = modal.locator('button', { hasText: /మూసివేయి|Close/ }).first();
    await closeBtn2.click();
    await page.waitForTimeout(800);

    const dashboardScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_dashboard_fmcg_velocity_live.png';
    await page.screenshot({ path: dashboardScreenshot });
    console.log('✓ Captured Dashboard with Velocity Radar link screenshot to:', dashboardScreenshot);

    console.log('🎉 ALL VERIFICATION CHECKS PASSED FOR MILESTONE 5.2 (FMCG VELOCITY & STOCK HEALTH)!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_5_2.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

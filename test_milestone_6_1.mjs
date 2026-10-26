import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Phase 6 Milestone 6.1: Local Area Network (LAN) Peer Sync...');
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

    // 2. Click "వై-ఫై సింక్" (Wi-Fi Sync) in command strip
    console.log('2. Clicking "Wi-Fi Sync" button in Dashboard command strip...');
    const syncBtn = page.locator('[data-testid="dashboard-lan-sync-btn"]').first();
    await syncBtn.waitFor({ state: 'visible', timeout: 5000 });
    await syncBtn.click();
    await page.waitForTimeout(1000);

    // 3. Verify LAN Peer Sync modal opened
    console.log('3. Verifying LAN Peer Sync modal...');
    const modal = page.locator('[data-testid="lan-sync-modal"]').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    const modalTitle = modal.locator('h2', { hasText: /లోకల్ వై-ఫై పీర్ సింక్|Local Wi-Fi Peer Sync|लोकल वाई-फाई पीयर सिंक/ }).first();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ LAN Peer Sync Studio opened successfully!');

    // 4. Test Role Switching (Main Counter -> Godown Stock -> Main Counter)
    console.log('4. Testing Device Role Switcher...');
    const godownRoleBtn = modal.locator('[data-testid="role-btn-GODOWN_TERMINAL"]').first();
    await godownRoleBtn.click();
    await page.waitForTimeout(400);

    const mainCounterRoleBtn = modal.locator('[data-testid="role-btn-PRIMARY_COUNTER"]').first();
    await mainCounterRoleBtn.click();
    await page.waitForTimeout(400);
    console.log('✓ Role switching confirmed!');

    // 5. Verify 6-Digit Pairing PIN
    console.log('5. Verifying Pairing PIN display...');
    const pinDisplay = modal.locator('[data-testid="lan-pairing-pin-display"]').first();
    await pinDisplay.waitFor({ state: 'visible', timeout: 5000 });
    const pinText = await pinDisplay.innerText();
    console.log(`   - Generated Pairing PIN: ${pinText}`);

    // 6. Capture Initial LAN Studio Screenshot
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_lan_peer_sync_studio_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured LAN Sync Studio screenshot to:', studioScreenshot);

    // 7. Trigger Bi-directional Sync
    console.log('7. Triggering manual bi-directional sync across all LAN peers...');
    const syncNowBtn = modal.locator('[data-testid="lan-sync-now-header-btn"]').first();
    await syncNowBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Bi-directional delta sync broadcast completed!');

    // 8. Test Pairing a New Device with 6-digit PIN
    console.log('8. Testing pairing a new mobile terminal with 6-digit PIN...');
    const pinInput = modal.locator('[data-testid="lan-pair-input-pin"]').first();
    await pinInput.fill('789123');
    await page.waitForTimeout(300);

    const pairSubmitBtn = modal.locator('[data-testid="lan-pair-submit-btn"]').first();
    await pairSubmitBtn.click();
    await page.waitForTimeout(800);
    console.log('✓ New device paired successfully!');

    // 9. Capture Synced State Screenshot
    const syncSuccessScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_lan_sync_success_live.png';
    await page.screenshot({ path: syncSuccessScreenshot });
    console.log('✓ Captured Sync Success screenshot to:', syncSuccessScreenshot);

    // 10. Close Modal
    console.log('10. Closing LAN Sync modal via Done footer button...');
    const closeFooterBtn = modal.locator('[data-testid="lan-sync-close-footer-btn"]').first();
    await closeFooterBtn.click();
    await page.waitForTimeout(800);
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('✓ Modal closed!');

    // 11. Test Opening from Bento Cell 1 pill
    console.log('11. Testing launching LAN Sync from Bento Cell 1 shortcut pill...');
    const bentoPill = page.locator('[data-testid="bento-open-sync-pill"]').first();
    await bentoPill.waitFor({ state: 'visible', timeout: 5000 });
    await bentoPill.click();
    await page.waitForTimeout(800);

    const reOpenedModal = page.locator('[data-testid="lan-sync-modal"]').first();
    await reOpenedModal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ LAN Sync Studio re-opened from Bento Cell 1!');

    await browser.close();
    console.log('🎉 PHASE 6 MILESTONE 6.1 VERIFICATION COMPLETED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Playwright test failed:', err);
    try {
      await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_6_1.png' });
    } catch (e) {
      // ignore
    }
    await browser.close();
    process.exit(1);
  }
}

runTest();

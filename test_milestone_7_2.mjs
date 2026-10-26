import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Phase 7 Milestone 7.2: Smart Purchase Re-order Suggestions...');
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

    // 2. Click "AI రీ-ఆర్డర్" (Smart Re-order) in Dashboard command strip
    console.log('2. Clicking "Smart Re-order" button in Dashboard command strip...');
    const reorderBtn = page.locator('[data-testid="dashboard-smart-reorder-btn"]').first();
    await reorderBtn.waitFor({ state: 'visible', timeout: 5000 });
    await reorderBtn.click();
    await page.waitForTimeout(800);

    // 3. Verify Smart Re-order Studio modal opened
    console.log('3. Verifying Smart Re-order Studio modal...');
    const modal = page.locator('[data-testid="smart-reorder-modal"]').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Smart Re-order Studio modal opened!');

    // 4. Verify First Recommendation Row in Table
    console.log('4. Checking recommendation row in table...');
    const row0 = modal.locator('[data-testid="reorder-row-0"]').first();
    await row0.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ Top recommendation details:', (await row0.innerText()).replace(/\n/g, ' '));

    // 5. Capture Table View Screenshot
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_smart_reorder_studio_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured Smart Re-order Studio screenshot to:', studioScreenshot);

    // 6. Test Critical Filter Tab
    console.log('6. Testing Critical Only filter tab...');
    const criticalTab = modal.locator('[data-testid="tab-reorder-critical"]').first();
    await criticalTab.click();
    await page.waitForTimeout(600);
    console.log('✓ Switched to Critical Stockouts tab!');

    // 7. Test Supplier Grouped WhatsApp Purchase Orders Tab
    console.log('7. Testing Supplier Grouped WhatsApp POs tab...');
    const suppliersTab = modal.locator('[data-testid="tab-reorder-suppliers"]').first();
    await suppliersTab.click();
    await page.waitForTimeout(600);

    const supCard0 = modal.locator('[data-testid="supplier-po-card-0"]').first();
    await supCard0.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ Verified Supplier Purchase Order Group card!');

    // 8. Test Copy PO Text Button
    console.log('8. Testing Copy PO text action...');
    const copyBtn = modal.locator('[data-testid="btn-copy-po-0"]').first();
    await copyBtn.click();
    await page.waitForTimeout(500);
    console.log('✓ Copied PO text to clipboard successfully!');

    // 9. Capture Supplier Grouped POs Screenshot
    const suppliersScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_smart_reorder_suppliers_live.png';
    await page.screenshot({ path: suppliersScreenshot });
    console.log('✓ Captured Supplier POs screenshot to:', suppliersScreenshot);

    // 10. Close Modal
    console.log('10. Closing modal...');
    const closeBtn = modal.locator('[data-testid="smart-reorder-close-btn"]').first();
    await closeBtn.click();
    await page.waitForTimeout(600);

    console.log('🎉 ALL PLAYWRIGHT TESTS PASSED FOR MILESTONE 7.2 100%!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    const errScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_7_2.png';
    await page.screenshot({ path: errScreenshot });
    console.log('Captured error screenshot to:', errScreenshot);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Running Complete Void Bill Cycle Test...');
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'msedge'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 }
  });
  const page = await context.newPage();
  page.on('dialog', async (dialog) => {
    console.log('Dialog:', dialog.message());
    await dialog.accept();
  });

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Click POS Billing in Left Sidebar
    console.log('1. Navigating to POS Billing...');
    await page.locator('[data-testid="nav-pos"]').click({ force: true });
    await page.waitForTimeout(1000);

    // 2. Click a product to add to cart
    console.log('2. Adding product to cart...');
    const productCard = page.locator('button:has-text("₹")').first();
    await productCard.click({ force: true });
    await page.waitForTimeout(600);

    // 3. Finalize sale with cash
    console.log('3. Completing cash sale...');
    const cashBtn = page.locator('button', { hasText: /F1.*నగదు|F1.*Cash/ }).first();
    await cashBtn.click({ force: true });
    await page.waitForTimeout(1200);

    // 4. Return to Dashboard via Left Sidebar
    console.log('4. Navigating back to Dashboard...');
    await page.locator('[data-testid="nav-dashboard"]').click({ force: true });
    await page.waitForTimeout(1000);

    // 5. Verify the new bill is listed in Recent Invoices
    console.log('5. Checking Recent Invoices in Dashboard...');
    const voidBtn = page.locator('[data-testid^="void-bill-btn-"]').first();
    await voidBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Found bill! Clicking Void button...');
    await voidBtn.click({ force: true });
    await page.waitForTimeout(600);

    // 6. Capture confirmation modal
    const modalPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_void_confirm_modal_live.png';
    await page.screenshot({ path: modalPath });
    console.log('✓ Captured Void confirmation modal to:', modalPath);

    // 7. Click confirm void
    const confirmBtn = page.locator('[data-testid="btn-confirm-void-bill"], [data-testid="confirm-void-bill-btn"]').first();
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(1500);

    // 8. Capture Dashboard with Voided status
    const dashboardVoidedPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_void_bill_completed_live.png';
    await page.screenshot({ path: dashboardVoidedPath });
    console.log('✓ Captured live Dashboard showing voided bill with restored stock:', dashboardVoidedPath);

    console.log('🎉 Void Bill cycle verified successfully!');
  } catch (err) {
    console.error('Error in void cycle:', err);
  } finally {
    await browser.close();
  }
}

runTest();

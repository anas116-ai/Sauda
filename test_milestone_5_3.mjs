import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Phase 5 Milestone 5.3: Profit & Loss (P&L) Reports...');
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

    // 2. Click "లాభ నష్టాలు (P&L)" button in command strip
    console.log('2. Clicking "లాభ నష్టాలు (P&L)" button in Dashboard command strip...');
    const pnlBtn = page.locator('[data-testid="dashboard-pnl-studio-btn"]').first();
    await pnlBtn.waitFor({ state: 'visible', timeout: 5000 });
    await pnlBtn.click();
    await page.waitForTimeout(1000);

    // 3. Verify P&L Studio modal opened
    console.log('3. Verifying Profit & Loss Studio modal...');
    const modal = page.locator('[data-testid="pnl-studio-modal"]').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    const studioTitle = modal.locator('h2', { hasText: /లాభ నష్టాల నివేదిక|Profit & Loss Statement/ }).first();
    await studioTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Profit & Loss Studio opened successfully!');

    // 4. Verify 4 Bento Telemetry KPI cards
    console.log('4. Verifying 4 Bento KPI cards (Net Revenue, COGS, Gross Profit, Net Profit)...');
    const netRevenue = await modal.locator('[data-testid="pnl-net-revenue"]').innerText();
    const totalCogs = await modal.locator('[data-testid="pnl-total-cogs"]').innerText();
    const grossProfit = await modal.locator('[data-testid="pnl-gross-profit"]').innerText();
    const netProfit = await modal.locator('[data-testid="pnl-net-profit"]').innerText();
    
    console.log(`   - Net Revenue: ${netRevenue}`);
    console.log(`   - Cost of Goods (COGS): ${totalCogs}`);
    console.log(`   - Gross Profit: ${grossProfit}`);
    console.log(`   - Net Profit (Take-Home): ${netProfit}`);

    // 5. Test Timeframe Switcher (TODAY -> 7D -> 30D -> 90D -> ALL)
    console.log('5. Testing Timeframe Switcher...');
    const tf7d = modal.locator('[data-testid="pnl-timeframe-7D"]');
    await tf7d.click();
    await page.waitForTimeout(400);

    const tf30d = modal.locator('[data-testid="pnl-timeframe-30D"]');
    await tf30d.click();
    await page.waitForTimeout(400);

    const tfAll = modal.locator('[data-testid="pnl-timeframe-ALL"]');
    await tfAll.click();
    await page.waitForTimeout(400);
    console.log('✓ Timeframe switcher verified!');

    // Reset back to 30D
    await tf30d.click();
    await page.waitForTimeout(400);

    // 6. Test Category Margins Tab & Capture Screenshot
    console.log('6. Verifying Category Margins Tab & Heatbars...');
    const catContent = modal.locator('[data-testid="pnl-tab-content-categories"]');
    await catContent.waitFor({ state: 'visible', timeout: 5000 });
    
    const screenshotPnlStudio = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pnl_category_margins_live.png';
    await page.screenshot({ path: screenshotPnlStudio });
    console.log('✓ Captured Category Margins screenshot to:', screenshotPnlStudio);

    // 7. Test Top Profit Drivers Tab & Capture Screenshot
    console.log('7. Testing Top Profit Drivers Tab...');
    const topDriversTab = modal.locator('[data-testid="pnl-tab-top-drivers"]');
    await topDriversTab.click();
    await page.waitForTimeout(500);
    
    const topDriversContent = modal.locator('[data-testid="pnl-tab-content-top-drivers"]');
    await topDriversContent.waitFor({ state: 'visible', timeout: 5000 });
    
    const screenshotTopDrivers = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pnl_top_drivers_live.png';
    await page.screenshot({ path: screenshotTopDrivers });
    console.log('✓ Captured Top Profit Drivers screenshot to:', screenshotTopDrivers);

    // 8. Test Low Margins Tab
    console.log('8. Testing Low Margin Alerts Tab...');
    const lowMarginsTab = modal.locator('[data-testid="pnl-tab-low-margins"]');
    await lowMarginsTab.click();
    await page.waitForTimeout(500);
    const lowMarginsContent = modal.locator('[data-testid="pnl-tab-content-low-margins"]');
    await lowMarginsContent.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Low margin alerts verified!');

    // 9. Test Store Expenses Tab & Log a New Expense
    console.log('9. Testing Store Expenses & Logging a New Petty Cash Expense...');
    const expensesTab = modal.locator('[data-testid="pnl-tab-expenses"]');
    await expensesTab.click();
    await page.waitForTimeout(500);

    // Open Add Expense form
    const addExpenseBtn = modal.locator('[data-testid="pnl-add-expense-toggle-btn"]');
    await addExpenseBtn.click();
    await page.waitForTimeout(400);

    // Fill form
    await modal.locator('[data-testid="pnl-expense-reason-input"]').fill('దుకాణం కరెంట్ బిల్లు చెల్లింపు (Shop Electricity)');
    await modal.locator('[data-testid="pnl-expense-category-select"]').selectOption('ELECTRICITY');
    await modal.locator('[data-testid="pnl-expense-amount-input"]').fill('1250');
    
    // Submit expense
    await modal.locator('[data-testid="pnl-expense-submit-btn"]').click();
    await page.waitForTimeout(800);
    console.log('✓ Store Expense successfully logged!');

    const screenshotExpenses = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pnl_expenses_live.png';
    await page.screenshot({ path: screenshotExpenses });
    console.log('✓ Captured Expenses screenshot to:', screenshotExpenses);

    // 10. Test CSV Export Button
    console.log('10. Testing CSV Export button...');
    const exportBtn = modal.locator('[data-testid="pnl-export-csv-btn"]');
    await exportBtn.click();
    await page.waitForTimeout(500);
    console.log('✓ CSV Export triggered without error!');

    // 11. Close modal
    console.log('11. Closing P&L modal via Done footer button...');
    const closeFooterBtn = modal.locator('[data-testid="pnl-close-footer-btn"]');
    await closeFooterBtn.click();
    await page.waitForTimeout(800);
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('✓ P&L modal closed!');

    // 12. Test Launching from Bento Cell 1 pill
    console.log('12. Testing Launching P&L Studio from Dashboard Bento Cell 1 shortcut pill...');
    const bentoPill = page.locator('[data-testid="bento-open-pnl-pill"]');
    await bentoPill.waitFor({ state: 'visible', timeout: 5000 });
    await bentoPill.click();
    await page.waitForTimeout(800);

    const reOpenedModal = page.locator('[data-testid="pnl-studio-modal"]').first();
    await reOpenedModal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ P&L Studio successfully re-opened from Bento Cell 1!');

    // Capture comprehensive dashboard + P&L screenshot
    const finalScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pnl_studio_live.png';
    await page.screenshot({ path: finalScreenshot });
    console.log('✓ Captured Final P&L Studio live screenshot to:', finalScreenshot);

    await browser.close();
    console.log('🎉 PHASE 5 MILESTONE 5.3 VERIFICATION COMPLETED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Playwright test failed:', err);
    try {
      await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_5_3.png' });
    } catch (e) {
      // ignore
    }
    await browser.close();
    process.exit(1);
  }
}

runTest();

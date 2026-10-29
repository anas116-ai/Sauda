import { chromium } from 'playwright';

const SCREENSHOTS_DIR = 'C:/Users/shaik/.gemini/antigravity-ide/brain/829f1c37-c95a-4123-aada-09c28787d219/screenshots';

async function run() {
  console.log('🚀 Running Luxury Revamp Verification...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  // 1. Visit root and clear dismissed flag to see full landing page
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.removeItem('sauda_gateway_dismissed'));
  await page.reload();
  await page.waitForTimeout(1500);

  // Capture Landing Page
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/landing_page_luxury.png` });
  console.log('📸 1. landing_page_luxury.png captured');

  // Test Language Dropdown
  const langDropdownBtn = page.locator('[data-testid="gateway-lang-dropdown-btn"]');
  if (await langDropdownBtn.isVisible()) {
    await langDropdownBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/landing_page_lang_dropdown.png` });
    console.log('📸 2. landing_page_lang_dropdown.png captured');
  }

  // Click Dashboard button
  const dashboardBtn = page.locator('[data-testid="gateway-goto-dashboard-btn"]');
  if (await dashboardBtn.isVisible()) {
    console.log('Clicking Go to Dashboard...');
    await dashboardBtn.click();
    await page.waitForTimeout(1500);
  }

  // Capture Dashboard with Light Sidebar
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/dashboard_with_light_sidebar.png` });
  console.log('📸 3. dashboard_with_light_sidebar.png captured');

  // Navigate to POS Billing
  const posBtn = page.locator('[data-testid="nav-pos"]');
  await posBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/pos_billing_screen.png` });
  console.log('📸 4. pos_billing_screen.png captured');

  // Navigate to Inventory & Stock
  const invBtn = page.locator('[data-testid="nav-products"]');
  await invBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/inventory_stock_screen.png` });
  console.log('📸 5. inventory_stock_screen.png captured');

  // Navigate to Customer Khata
  const khataBtn = page.locator('[data-testid="nav-khata"]');
  await khataBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/customer_khata_screen.png` });
  console.log('📸 6. customer_khata_screen.png captured');

  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

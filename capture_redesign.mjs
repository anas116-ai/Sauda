import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13';

async function captureRedesignedScreens() {
  console.log('📸 Capturing redesigned UI screenshots...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('dialog', async (d) => await d.accept());

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Dashboard
    console.log('1. Dashboard...');
    await page.screenshot({ path: `${ARTIFACT_DIR}/redesign_dashboard.png`, fullPage: true });

    // 2. POS Screen with cart
    console.log('2. POS Screen...');
    await page.locator('header button, nav button', { hasText: /POS బిల్లింగ్|Fast Billing/ }).first().click();
    await page.waitForTimeout(1000);

    // Add items to cart
    await page.locator('button', { hasText: 'ఫ్రీడమ్ నూనె' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: 'సబ్బు' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: 'ఆటా 10kg' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: 'టాటా ఉప్పు' }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${ARTIFACT_DIR}/redesign_pos_with_cart.png`, fullPage: true });

    // 3. Inventory Screen
    console.log('3. Inventory Screen...');
    await page.locator('header button, nav button', { hasText: /ఇన్వెంటరీ|Inventory/ }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/redesign_inventory.png`, fullPage: true });

    // 4. Khata Screen
    console.log('4. Khata Screen...');
    await page.locator('header button, nav button', { hasText: /ఖాతా లెడ్జర్|Khata Ledger/ }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/redesign_khata.png`, fullPage: true });

    console.log('✓ All 4 redesigned screenshots captured!');
  } finally {
    await browser.close();
  }
}

captureRedesignedScreens();

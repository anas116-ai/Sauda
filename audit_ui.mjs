import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13';

async function auditAllScreens() {
  console.log('🔍 Starting Complete UI/UX Visual Audit of Sauda Application...\n');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('dialog', async (d) => await d.accept());

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✓ App loaded\n');

    // 1. DASHBOARD SCREEN
    console.log('📸 1. Capturing Dashboard Screen...');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_dashboard.png`, fullPage: true });
    console.log('✓ Dashboard captured\n');

    // 2. POS BILLING SCREEN
    console.log('📸 2. Capturing POS Billing Screen (empty cart)...');
    await page.locator('button', { hasText: /POS బిల్లింగ్|Fast Billing/ }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_pos_empty.png`, fullPage: true });
    console.log('✓ POS empty state captured');

    // Add items to cart for full state
    console.log('   Adding items to cart...');
    await page.locator('button', { hasText: 'ఫ్రీడమ్ నూనె' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: 'సబ్బు' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: 'ఆటా 10kg' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: 'టాటా ఉప్పు' }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_pos_with_cart.png`, fullPage: true });
    console.log('✓ POS with cart items captured\n');

    // 3. POS - B2B Modal
    console.log('📸 3. Capturing B2B Tax Invoice Modal...');
    const b2bBtn = page.locator('button', { hasText: /B2B టాక్స్ ఇన్వాయిస్|B2B Tax Invoice/ }).first();
    await b2bBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_b2b_modal.png` });
    // Close modal
    await page.locator('button', { hasText: /రద్దు చేయి|Cancel/ }).first().click();
    await page.waitForTimeout(300);
    console.log('✓ B2B Modal captured\n');

    // 4. POS - GSTR-1 Modal
    console.log('📸 4. Capturing GSTR-1 Report Studio Modal...');
    await page.locator('button', { hasText: /GSTR-1 రిపోర్టులు|GSTR-1 Reports/ }).first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_gstr1_modal.png` });
    await page.locator('button:has(svg.lucide-x)').first().click();
    await page.waitForTimeout(300);
    console.log('✓ GSTR-1 Modal captured\n');

    // 5. Finalize a sale to see receipt modal
    console.log('📸 5. Capturing Thermal Receipt Modal...');
    await page.locator('button', { hasText: /నగదు \/ Cash|Cash Payment/ }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_receipt_modal.png` });
    // Close
    await page.locator('button', { hasText: /కొత్త కస్టమర్ బిల్లు ప్రారంభించండి|Start Next Bill/ }).first().click();
    await page.waitForTimeout(500);
    console.log('✓ Receipt Modal captured\n');

    // 6. INVENTORY / PRODUCTS SCREEN
    console.log('📸 6. Capturing Inventory Screen...');
    await page.locator('header button', { hasText: /ఇన్వెంటరీ|Inventory/ }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_inventory.png`, fullPage: true });
    console.log('✓ Inventory captured\n');

    // 7. KHATA LEDGER SCREEN
    console.log('📸 7. Capturing Khata Ledger Screen...');
    await page.locator('header button', { hasText: /ఖాతా లెడ్జర్|Khata Ledger/ }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_khata.png`, fullPage: true });
    console.log('✓ Khata Ledger captured\n');

    // 8. SETTINGS SCREEN
    console.log('📸 8. Capturing Settings Screen...');
    await page.locator('header button', { hasText: /సెట్టింగ్స్|Settings/ }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_settings.png`, fullPage: true });
    console.log('✓ Settings captured\n');

    // 9. Also capture at smaller viewport (tablet)
    console.log('📸 9. Capturing POS at tablet viewport (768px)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.locator('header button, nav button', { hasText: /POS బిల్లింగ్|Fast Billing/ }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_pos_tablet.png`, fullPage: true });
    console.log('✓ Tablet viewport captured\n');

    console.log('🎉 ALL 9 AUDIT SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Audit capture failed:', err.message);
    // Take error state screenshot
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_error_state.png` });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

auditAllScreens();

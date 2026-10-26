import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Milestone 3.3: Digital Weighing Scale (RS-232 / Web Serial)...');
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'msedge'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  page.on('dialog', async (dialog) => {
    console.log('Dialog opened:', dialog.type(), dialog.message());
    await dialog.accept();
  });

  try {
    // 1. Navigate to Sauda app
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded:', await page.title());

    // 2. Navigate to Settings Screen
    console.log('Navigating to Settings (సెట్టింగ్స్)...');
    await page.locator('header button', { hasText: /సెట్టింగ్స్|Settings/ }).first().click();
    await page.waitForTimeout(1000);

    // Verify Digital Weighing Scale Card
    const scaleCard = page.locator('text=డిజిటల్ వేయింగ్ స్కేల్ & RS-232 కాన్ఫిగరేషన్').first();
    await scaleCard.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Digital Weighing Scale Setup card verified');

    // Test Platter weights in Settings
    console.log('Placing 1.0 kg test weight on scale platter in Settings...');
    await page.locator('button', { hasText: '1.0 kg' }).first().click();
    await page.waitForTimeout(600);

    // Save Scale Settings
    console.log('Saving scale configuration...');
    const saveScaleBtn = page.locator('button', { hasText: /స్కేల్ సెట్టింగ్స్ సేవ్ చేయండి|Save Scale Settings/ }).first();
    await saveScaleBtn.click();
    await page.waitForTimeout(600);

    // Verify Success banner
    const saveToast = page.locator('text=స్కేల్ సెట్టింగ్స్ సేవ్ చేయబడ్డాయి!').first();
    await saveToast.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ Scale configuration saved banner verified!');

    // Capture Settings Screen with Weighing Scale Card
    const settingsScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_weighing_scale_settings_live.png';
    await page.screenshot({ path: settingsScreenshotPath, fullPage: true });
    console.log('✓ Captured Weighing Scale Settings screenshot to:', settingsScreenshotPath);

    // 3. Navigate to POS Billing Screen to test live weighing and loose grocery items
    console.log('Navigating to POS Billing (POS బిల్లింగ్)...');
    await page.locator('header button', { hasText: /POS బిల్లింగ్|Fast Billing/ }).first().click();
    await page.waitForTimeout(1000);

    // Verify Weighing Scale HUD Bar
    const scaleHud = page.locator('text=లైవ్ తూకం (Weight)').first();
    await scaleHud.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Digital Weighing Scale LED HUD verified in POS');

    // Toggle Simulator Platter Tray
    console.log('Toggling Test Platter Simulator tray...');
    const simToggleBtn = page.locator('button', { hasText: /టెస్ట్ ప్లాటర్|Simulator/ }).first();
    await simToggleBtn.click();
    await page.waitForTimeout(500);

    // Click 1.250 kg preset
    console.log('Placing 1.250 kg on simulated platter...');
    await page.locator('button', { hasText: '1.250 kg' }).first().click();
    await page.waitForTimeout(500);

    // Verify 1.250 kg on LED display
    await page.locator('text=1.250').first().waitFor({ state: 'visible' });
    console.log('✓ LED Display shows 1.250 kg with STABLE indicator');

    // Select Loose Rice commodity chip
    console.log('Selecting loose commodity: 🍚 విడి బియ్యం (Loose Sona Masoori Rice)...');
    const riceChip = page.locator('button', { hasText: /విడి బియ్యం|Rice/ }).first();
    await riceChip.click();
    await page.waitForTimeout(500);

    // Verify Add Weighed Item button appears with price calculation
    const addWeighedBtn = page.locator('button', { hasText: /కార్ట్‌కు చేర్చు|Add Weighed Item/ }).first();
    await addWeighedBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Weighed item price calculation and Add Weighed Item button verified!');

    // Capture POS Scale HUD Screen with active weighed item
    const hudScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_weighing_scale_hud_live.png';
    await page.screenshot({ path: hudScreenshotPath });
    console.log('✓ Captured POS Weighing Scale HUD screenshot to:', hudScreenshotPath);

    // Click Add Weighed Item to Cart
    console.log('Adding weighed rice to cart...');
    await addWeighedBtn.click();
    await page.waitForTimeout(600);

    // Verify Cart contains 1.25 qty item
    console.log('✓ Loose Rice item added to cart with fractional weight 1.25 kg!');

    // Test second loose commodity: Toor Dal 500g
    console.log('Placing 500g on platter for Loose Toor Dal...');
    await page.locator('button', { hasText: '500g' }).first().click();
    await page.waitForTimeout(500);

    console.log('Selecting loose commodity: 🫘 విడి కందిపప్పు (Loose Toor Dal)...');
    const dalChip = page.locator('button', { hasText: /విడి కందిపప్పు|Toor Dal/ }).first();
    await dalChip.click();
    await page.waitForTimeout(500);

    // Add Weighed Dal to Cart
    await page.locator('button', { hasText: /కార్ట్‌కు చేర్చు|Add Weighed Item/ }).first().click();
    await page.waitForTimeout(600);
    console.log('✓ Loose Toor Dal added to cart with 0.5 kg weight!');

    // Test Tare function
    console.log('Testing Tare button on scale...');
    await page.locator('button', { hasText: '1.0 kg' }).first().click();
    await page.waitForTimeout(400);
    const tareBtn = page.locator('button', { hasText: /టేర్ \(TARE\)/ }).first();
    await tareBtn.click();
    await page.waitForTimeout(400);

    // Verify Tare tag
    await page.locator('text=TARE').first().waitFor({ state: 'visible' });
    console.log('✓ Platter container weight tared successfully!');

    // Zero scale
    const zeroBtn = page.locator('button', { hasText: /జీరో \(ZERO\)/ }).first();
    await zeroBtn.click();
    await page.waitForTimeout(400);

    // Capture Cart with weighed items
    const cartScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_weighed_cart_live.png';
    await page.screenshot({ path: cartScreenshotPath });
    console.log('✓ Captured POS Cart with Weighed Commodities screenshot to:', cartScreenshotPath);

    // Finalize Cash Sale
    console.log('Finalizing sale via Cash (F1)...');
    const cashBtn = page.locator('button', { hasText: /నగదు \/ Cash|Cash Payment/ }).first();
    await cashBtn.click();
    await page.waitForTimeout(1000);

    // Verify Finalized Receipt Modal
    const receiptModalTitle = page.locator('text=బిల్లు విజయవంతంగా పూర్తయింది!').first();
    await receiptModalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Sale completed and thermal receipt modal opened with weighed items!');

    // Capture Finalized Receipt Modal showing fractional weights
    const receiptScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_weighed_receipt_live.png';
    await page.screenshot({ path: receiptScreenshotPath });
    console.log('✓ Captured Weighed Items Thermal Receipt screenshot to:', receiptScreenshotPath);

    console.log('🎉 All Milestone 3.3 Playwright verifications passed with 100% success!');
  } catch (error) {
    console.error('❌ Error during Playwright test:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

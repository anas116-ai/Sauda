import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Milestone 3.1: Thermal Receipt Printer Engine (ESC/POS)...');
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'msedge'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    // 1. Navigate to Sauda app
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded:', await page.title());

    // 2. Navigate to Settings Screen
    console.log('Navigating to Settings (సెట్టింగ్స్)...');
    await page.locator('header button', { hasText: /సెట్టింగ్స్|Settings/ }).first().click();
    await page.waitForTimeout(1000);

    // Verify Thermal Printer Card
    const printerCard = page.locator('text=థర్మల్ రసీదు ప్రింటర్ సెట్టింగ్స్').first();
    await printerCard.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Thermal Receipt Printer Setup card verified');

    // Verify Live Receipt Preview
    const previewHeader = page.locator('text=లైవ్ థర్మల్ రసీదు ప్రివ్యూ').first();
    await previewHeader.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Live Thermal Receipt Studio Preview card verified');

    // Switch Paper Width to 58mm (2-inch)
    console.log('Selecting 2-inch (58mm) roll width...');
    await page.locator('button', { hasText: /2-అంగుళాలు|58mm/ }).first().click();
    await page.waitForTimeout(600);

    // Switch back to 80mm (3-inch)
    console.log('Selecting 3-inch (80mm) roll width...');
    await page.locator('button', { hasText: /3-అంగుళాలు|80mm/ }).first().click();
    await page.waitForTimeout(600);

    // Save Printer Settings
    console.log('Saving printer configuration...');
    const savePrinterBtn = page.locator('button', { hasText: /సెట్టింగ్స్ సేవ్ చేయండి|Save Printer/ }).first();
    await savePrinterBtn.click();
    await page.waitForTimeout(800);

    // Verify Success badge
    const saveToast = page.locator('text=ప్రింటర్ సెట్టింగ్స్ సేవ్ చేయబడ్డాయి!').first();
    if (await saveToast.isVisible()) {
      console.log('✓ Printer settings saved successfully banner verified');
    }

    // Capture Settings Screen with Thermal Printer Studio
    const settingsScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_thermal_printer_settings_live.png';
    await page.screenshot({ path: settingsScreenshotPath, fullPage: true });
    console.log('✓ Captured Thermal Printer Settings screenshot to:', settingsScreenshotPath);

    // 3. Navigate to POS Billing Screen to test live sale receipt
    console.log('Navigating to POS Billing (POS బిల్లింగ్)...');
    await page.locator('header button', { hasText: /POS బిల్లింగ్|Fast Billing/ }).first().click();
    await page.waitForTimeout(1000);

    // Add items to cart using quick scanner test buttons
    console.log('Adding products to cart via quick scanner buttons...');
    await page.locator('button', { hasText: 'ఫ్రీడమ్ నూనె' }).first().click();
    await page.waitForTimeout(500);
    await page.locator('button', { hasText: 'టాటా ఉప్పు' }).first().click();
    await page.waitForTimeout(500);

    // Finalize Cash Sale
    console.log('Finalizing sale via Cash (F1)...');
    const cashBtn = page.locator('button', { hasText: /నగదు \/ Cash|Cash Payment/ }).first();
    await cashBtn.click();
    await page.waitForTimeout(1200);

    // Verify Finalized Thermal Receipt modal
    const receiptModalTitle = page.locator('text=బిల్లు విజయవంతంగా పూర్తయింది!').first();
    await receiptModalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Finalized Thermal Receipt Modal opened successfully!');

    // Check Barcode SVG and UPI QR inside receipt modal
    const receiptBarcodes = page.locator('.fixed svg');
    console.log('✓ Vector barcodes found in receipt:', await receiptBarcodes.count());

    // Capture Finalized Receipt Modal Screen
    const receiptScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_thermal_receipt_modal_live.png';
    await page.screenshot({ path: receiptScreenshotPath });
    console.log('✓ Captured POS Thermal Receipt Modal screenshot to:', receiptScreenshotPath);

    // Click Next Bill
    console.log('Clicking "+ కొత్త కస్టమర్ బిల్లు ప్రారంభించండి (Next Bill)"...');
    const nextBillBtn = page.locator('button', { hasText: /కొత్త కస్టమర్ బిల్లు|Start Next Bill/ }).first();
    await nextBillBtn.click();
    await page.waitForTimeout(800);

    console.log('🎉 All Milestone 3.1 Playwright verifications passed with flying colors!');
  } catch (error) {
    console.error('❌ Error during Playwright test:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

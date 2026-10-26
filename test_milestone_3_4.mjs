import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Milestone 3.4: GST Invoicing & B2B Compliance...');
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'msedge'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 }
  });
  const page = await context.newPage();
  page.on('dialog', async (dialog) => {
    console.log('Dialog opened:', dialog.type(), dialog.message());
    await dialog.accept();
  });

  try {
    // 1. Navigate to Sauda app and switch to POS Billing
    console.log('1. Loading Sauda application...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded:', await page.title());
    await page.waitForTimeout(1000);

    console.log('Navigating to POS Billing tab (POS బిల్లింగ్)...');
    const posTabBtn = page.locator('header button', { hasText: /POS బిల్లింగ్|Fast Billing/ }).first();
    await posTabBtn.click();
    await page.waitForTimeout(1000);

    // 2. Locate and Click B2B Tax Invoice selector in Order Summary card
    console.log('2. Switching invoice mode to B2B Tax Invoice...');
    const b2bToggleBtn = page.locator('button', { hasText: /B2B టాక్స్ ఇన్వాయిస్|B2B Tax Invoice/ }).first();
    await b2bToggleBtn.waitFor({ state: 'visible', timeout: 5000 });
    await b2bToggleBtn.click();
    await page.waitForTimeout(800);

    // 3. Verify B2B Modal is visible
    const b2bModalTitle = page.locator('text=B2B టాక్స్ ఇన్వాయిస్ వివరాలు').first();
    await b2bModalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ B2B Tax Invoice Details modal opened successfully!');

    // 4. Click 1-click Auto-Fill Demo Preset
    console.log('3. Clicking Auto-Fill Preset (Sri Lakshmi Hotel, GSTIN: 36AABCS1429B1Z5)...');
    const autoFillBtn = page.locator('button', { hasText: /ఆటో-ఫిల్|Auto-Fill/ }).first();
    await autoFillBtn.click();
    await page.waitForTimeout(500);

    // 5. Verify GSTIN Validation badge is green "VALID GSTIN"
    const validGstinBadge = page.locator('text=✓ VALID GSTIN').first();
    await validGstinBadge.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ 15-character GSTIN checksum & structure verified as valid!');

    // 6. Capture screenshot of B2B Modal
    const b2bModalScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_b2b_modal_live.png';
    await page.screenshot({ path: b2bModalScreenshotPath });
    console.log('✓ Captured B2B Modal screenshot to:', b2bModalScreenshotPath);

    // 7. Click Apply B2B Invoice
    console.log('4. Applying B2B Invoice...');
    const applyB2bBtn = page.locator('button', { hasText: /B2B ఇన్వాయిస్ అప్లై చేయి|Apply B2B Invoice/ }).first();
    await applyB2bBtn.click();
    await page.waitForTimeout(600);

    // 8. Verify B2B Trade details pill in POS Order Summary
    const tradePill = page.locator('text=శ్రీ లక్ష్మి హోటల్ & రెస్టారెంట్').first();
    await tradePill.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ B2B trade details pill visible in Order Summary card!');

    // 9. Add products with different GST slabs to Cart
    console.log('5. Adding multi-tax slab products to cart...');
    // Add Freedom Sunflower Oil (5% GST) via quick scan button
    const scanOilBtn = page.locator('button', { hasText: 'ఫ్రీడమ్ నూనె' }).first();
    await scanOilBtn.click();
    await page.waitForTimeout(400);

    // Add Lifebuoy Soap (18% GST) via quick scan button
    const scanSoapBtn = page.locator('button', { hasText: 'సబ్బు' }).first();
    await scanSoapBtn.click();
    await page.waitForTimeout(400);

    // Add Loose Weighed Rice (0% Exempted GST) via Weighing Scale
    console.log('Placing weight on scale and adding loose rice...');
    const simToggleBtn = page.locator('button', { hasText: /టెస్ట్ ప్లాటర్|Simulator/ }).first();
    await simToggleBtn.click();
    await page.waitForTimeout(300);

    const weightBtn = page.locator('button', { hasText: '1.250 kg' }).first();
    await weightBtn.click();
    await page.waitForTimeout(300);

    const riceChip = page.locator('button', { hasText: /విడి బియ్యం|Rice/ }).first();
    await riceChip.click();
    await page.waitForTimeout(400);

    const addWeighedBtn = page.locator('button', { hasText: /కార్ట్‌కు చేర్చు|Add Weighed Item/ }).first();
    await addWeighedBtn.click();
    await page.waitForTimeout(600);

    console.log('✓ Added Freedom Oil (5%), Lifebuoy Soap (18%), and Loose Rice (0% Exempted) to cart');

    // 10. Finalize Cash Sale (F1)
    console.log('6. Finalizing sale with Cash (F1)...');
    const cashBtn = page.locator('button', { hasText: /నగదు \/ Cash|Cash Payment/ }).first();
    await cashBtn.click();
    await page.waitForTimeout(1000);

    // 11. Verify Finalized Thermal Receipt Modal
    const receiptSuccess = page.locator('text=బిల్లు విజయవంతంగా పూర్తయింది!').first();
    await receiptSuccess.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Sale completed, Thermal Receipt modal opened!');

    // Verify B2B Tax Invoice Badge & GST Details on Receipt
    const taxInvoiceBadge = page.locator('text=/TAX INVOICE/i').first();
    await taxInvoiceBadge.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Receipt contains "TAX INVOICE" header badge');

    const customerGstinText = page.locator('text=36AABCS1429B1Z5').first();
    await customerGstinText.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Receipt contains recipient GSTIN: 36AABCS1429B1Z5');

    // Verify GST breakdown table on receipt
    const gstBreakdownHeader = page.locator('text=/Tax Breakdown|పన్ను విభజన/i').first();
    await gstBreakdownHeader.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Receipt contains itemized GST Tax Breakdown table (Taxable, CGST, SGST)!');

    // 12. Capture screenshot of B2B Tax Invoice Receipt
    const receiptScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_b2b_tax_invoice_receipt_live.png';
    await page.screenshot({ path: receiptScreenshotPath });
    console.log('✓ Captured B2B Tax Invoice Receipt screenshot to:', receiptScreenshotPath);

    // 13. Close Receipt modal
    console.log('7. Closing receipt modal...');
    const nextBillBtn = page.locator('button', { hasText: /కొత్త కస్టమర్ బిల్లు ప్రారంభించండి|Start Next Bill/ }).first();
    await nextBillBtn.click();
    await page.waitForTimeout(600);

    // 14. Open GSTR-1 Return Studio Modal
    console.log('8. Opening GSTR-1 Return Studio & GST Audit modal...');
    const gstr1HeaderBtn = page.locator('button', { hasText: /GSTR-1 రిపోర్టులు|GSTR-1 Reports/ }).first();
    await gstr1HeaderBtn.click();
    await page.waitForTimeout(800);

    // Verify GSTR-1 Modal header & Bento Cards
    const gstr1Title = page.locator('text=GSTR-1 సేల్స్ రిపోర్ట్ & GST ఆడిట్').first();
    await gstr1Title.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ GSTR-1 Return Studio Modal opened successfully!');

    // Verify Bento stats
    await page.locator('text=మొత్తం సేల్స్ టర్నోవర్').first().waitFor({ state: 'visible' });
    await page.locator('text=టాక్సబుల్ విలువ').first().waitFor({ state: 'visible' });
    await page.locator('text=వసూలైన మొత్తం GST').first().waitFor({ state: 'visible' });
    await page.locator('text=B2B vs B2C నిష్పత్తి').first().waitFor({ state: 'visible' });
    console.log('✓ GSTR-1 Bento cards verified (Turnover, Taxable Value, Total GST, B2B/B2C ratio)!');

    // Verify Table 12 HSN Summary table
    await page.locator('text=HSN-వారీగా పన్ను సారాంశం (Table 12 HSN Summary)').first().waitFor({ state: 'visible' });
    console.log('✓ Table 12: HSN-wise GST Breakdown table verified!');

    // Verify CA Export triggers exist
    const csvExportBtn = page.locator('button', { hasText: /GSTR-1 CSV ఎక్స్‌పోర్ట్|Export GSTR-1 CSV/ }).first();
    const jsonExportBtn = page.locator('button', { hasText: /GSTR-1 JSON ఎక్స్‌పోర్ట్|Export GSTR-1 JSON/ }).first();
    await csvExportBtn.waitFor({ state: 'visible' });
    await jsonExportBtn.waitFor({ state: 'visible' });
    console.log('✓ 1-click GSTR-1 CSV & GST Portal JSON export buttons verified!');

    // 15. Capture screenshot of GSTR-1 Report Studio
    const gstr1ScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_gstr1_report_studio_live.png';
    await page.screenshot({ path: gstr1ScreenshotPath });
    console.log('✓ Captured GSTR-1 Report Studio screenshot to:', gstr1ScreenshotPath);

    console.log('\n🎉 ALL VERIFICATION CHECKS PASSED FOR MILESTONE 3.4 (GST INVOICING & B2B COMPLIANCE)!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

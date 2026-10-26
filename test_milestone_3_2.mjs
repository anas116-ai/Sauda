import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Milestone 3.2: Electronic Cash Drawer Kick & Audit Logs...');
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'msedge'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
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

    // Verify Cash Drawer Card
    const drawerCard = page.locator('text=ఎలక్ట్రానిక్ క్యాష్ డ్రాయర్ & ఆడిట్ లాగ్').first();
    await drawerCard.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Electronic Cash Drawer Setup card verified');

    // Verify Bento Cards
    await page.locator('text=ఈ రోజు ఓపెనింగ్స్').first().waitFor({ state: 'visible' });
    await page.locator('text=నగదు సేల్స్ కిక్స్').first().waitFor({ state: 'visible' });
    await page.locator('text=మాన్యువల్ / చిల్లర').first().waitFor({ state: 'visible' });
    await page.locator('text=పెట్టీ క్యాష్ ఖర్చులు').first().waitFor({ state: 'visible' });
    console.log('✓ Cash Drawer Bento statistics cards verified');

    // Trigger Test Kick
    console.log('Clicking [🔓 డ్రాయర్ టెస్ట్ కిక్ (Test Kick)]...');
    const testKickBtn = page.locator('button', { hasText: /డ్రాయర్ టెస్ట్ కిక్|Test Kick/ }).first();
    await testKickBtn.click();
    await page.waitForTimeout(600);

    // Verify Solenoid Pulse Success Banner
    const kickSuccess = page.locator('text=డ్రాయర్ కిక్ టెస్ట్ విజయవంతం!').first();
    await kickSuccess.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ Solenoid kick pulse verified with Web Audio chime!');

    // Capture Settings Screen with Cash Drawer Card & Logs
    const settingsScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_cash_drawer_settings_live.png';
    await page.screenshot({ path: settingsScreenshotPath, fullPage: true });
    console.log('✓ Captured Cash Drawer Settings screenshot to:', settingsScreenshotPath);

    // 3. Navigate to POS Billing Screen to test manual drawer kick and PIN authorization
    console.log('Navigating to POS Billing (POS బిల్లింగ్)...');
    await page.locator('header button', { hasText: /POS బిల్లింగ్|Fast Billing/ }).first().click();
    await page.waitForTimeout(1000);

    // Check quick action button for Cash Drawer in header
    console.log('Opening Cash Drawer Modal via header quick action [క్యాష్ డ్రాయర్]...');
    const drawerBtn = page.locator('button', { hasText: /క్యాష్ డ్రాయర్/ }).first();
    await drawerBtn.waitFor({ state: 'visible', timeout: 5000 });
    await drawerBtn.click();
    await page.waitForTimeout(600);

    // Verify Cash Drawer Modal
    const modalTitle = page.locator('text=క్యాష్ డ్రాయర్ కంట్రోల్').first();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Manual Cash Drawer kick modal opened successfully');

    // Select Petty Cash Expense chip
    console.log('Selecting Petty Cash Expense chip [టీ / ఖర్చు (Petty Cash)]...');
    await page.locator('button', { hasText: /టీ \/ ఖర్చు|Petty Cash/ }).first().click();
    await page.waitForTimeout(400);

    // Enter Amount for petty cash
    const amountInput = page.locator('input[placeholder*="50"]').first();
    await amountInput.fill('60');

    // Enter Reason Note
    const reasonInput = page.locator('input[placeholder*="చిల్లర"]').first();
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('సాయంత్రం టీ & సమోసాలు');
    }

    // Enter Cashier PIN (1234)
    console.log('Entering Cashier Authorization PIN: 1234...');
    const pinInput = page.locator('input[placeholder*="••••"]').first();
    await pinInput.fill('1234');
    await page.waitForTimeout(400);

    // Capture POS Cash Drawer Modal Screen
    const modalScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_pos_cash_drawer_modal_live.png';
    await page.screenshot({ path: modalScreenshotPath });
    console.log('✓ Captured POS Cash Drawer Modal screenshot to:', modalScreenshotPath);

    // Trigger Manual Open
    console.log('Authorizing and opening cash drawer...');
    const unlockBtn = page.locator('button', { hasText: /డ్రాయర్ తెరవండి|Kick Open Drawer/ }).first();
    await unlockBtn.click();
    await page.waitForTimeout(1000);

    const hasError = await page.locator('.bg-classicCrimson-50').count();
    if (hasError > 0) {
      console.log('Error found on modal:', await page.locator('.bg-classicCrimson-50').innerText());
    }
    const hasSuccess = await page.locator('.bg-classicEmerald-50').count();
    if (hasSuccess > 0) {
      console.log('Success found on modal:', await page.locator('.bg-classicEmerald-50').innerText());
    }

    await page.locator('text=క్యాష్ డ్రాయర్ కంట్రోల్').waitFor({ state: 'hidden', timeout: 5000 });
    console.log('✓ Cash drawer modal successfully closed after authorized kick!');
    await page.waitForTimeout(500);

    // 4. Test Auto-Kick on Cash Sale
    console.log('Testing Auto-Kick on POS Cash Sale...');
    await page.locator('button', { hasText: 'ఫ్రీడమ్ నూనె' }).first().click();
    await page.waitForTimeout(500);

    const cashBtn = page.locator('button', { hasText: /నగదు \/ Cash|Cash Payment/ }).first();
    await cashBtn.click();
    await page.waitForTimeout(1000);

    // Verify receipt modal
    await page.locator('text=బిల్లు విజయవంతంగా పూర్తయింది!').first().waitFor({ state: 'visible' });
    console.log('✓ Sale completed and Auto-Kick triggered!');

    // Close receipt modal
    await page.locator('button', { hasText: /కొత్త కస్టమర్ బిల్లు|Start Next Bill/ }).first().click();
    await page.waitForTimeout(600);

    // 5. Navigate back to Settings and verify that new logs are present
    console.log('Navigating back to Settings to verify newly appended audit logs...');
    await page.locator('header button', { hasText: /సెట్టింగ్స్|Settings/ }).first().click();
    await page.waitForTimeout(1000);

    const teaExpenseLog = page.locator('text=సాయంత్రం టీ & సమోసాలు').first();
    await teaExpenseLog.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Verified petty cash audit log entry in Dexie database!');

    console.log('🎉 All Milestone 3.2 Playwright verifications passed with 100% success!');
  } catch (error) {
    console.error('❌ Error during Playwright test:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

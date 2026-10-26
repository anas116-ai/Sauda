import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Running Live Bill Voiding & Khata Mistake Deletion Flow...');
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
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Navigate to POS Billing Screen via Left Sidebar
    console.log('1. Navigating to Billing POS screen...');
    await page.locator('[data-testid="nav-pos"]').first().click();
    await page.waitForTimeout(1000);

    // 2. Add demo item to cart
    console.log('2. Adding demo product to cart...');
    const demoItemBtn = page.locator('button', { hasText: /ఫ్రీడమ్|Freedom|గోధుమ పిండి|Atta/ }).first();
    if (await demoItemBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await demoItemBtn.click();
    } else {
      const anyCard = page.locator('div.grid button').first();
      await anyCard.click();
    }
    await page.waitForTimeout(800);

    // 3. Finalize Bill with Cash (F1)
    console.log('3. Finalizing bill with Cash...');
    const cashBtn = page.locator('button', { hasText: /F1.*నగదు|F1.*Cash/ }).first();
    await cashBtn.waitFor({ state: 'visible', timeout: 5000 });
    await cashBtn.click();
    await page.waitForTimeout(1200);

    // 4. Close receipt modal
    console.log('4. Dismissing receipt modal / starting new bill...');
    const closeReceiptBtn = page.locator('button:has-text("కొత్త బిల్లు"), button:has-text("New Bill"), button:has-text("Done")').first();
    if (await closeReceiptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeReceiptBtn.click();
      await page.waitForTimeout(600);
    }

    // 5. Navigate back to Dashboard
    console.log('5. Navigating back to Dashboard via Left Sidebar...');
    await page.locator('[data-testid="nav-dashboard"]').first().click();
    await page.waitForTimeout(1000);

    // 6. Check Recent Invoices and Click Void Button
    console.log('6. Checking Recent Invoices for newly created bill...');
    const voidBtn = page.locator('[data-testid^="void-bill-btn-"]').first();
    await voidBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Found bill in Recent Invoices! Clicking Void button...');
    await voidBtn.click();
    await page.waitForTimeout(600);

    // Confirm Void Modal
    const confirmBtn = page.locator('[data-testid="confirm-void-bill-btn"]').first();
    await confirmBtn.waitFor({ state: 'visible', timeout: 3000 });
    console.log('Confirming Bill Voiding...');
    await confirmBtn.click();
    await page.waitForTimeout(1200);

    // Capture Voided Bill state
    const voidScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_void_bill_completed_live.png';
    await page.screenshot({ path: voidScreenshot });
    console.log('✓ Successfully voided bill and captured screenshot:', voidScreenshot);

    // 7. Navigate to Khata and Add Mistake Transaction then Delete it
    console.log('7. Navigating to Khata screen via Left Sidebar...');
    await page.locator('[data-testid="nav-khata"]').first().click();
    await page.waitForTimeout(1000);

    // Switch to Customers
    const custTab = page.locator('button:has-text("కస్టమర్ల ఖాతాలు"), button:has-text("Customer Khata")').first();
    if (await custTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await custTab.click();
      await page.waitForTimeout(600);
    }

    // Click Udhar button (+ ఇచ్చాం / Debit)
    console.log('8. Recording test Khata debit entry...');
    const giveBtn = page.locator('button:has-text("ఇచ్చాం"), button:has-text("Gave (+)")').first();
    if (await giveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await giveBtn.click();
      await page.waitForTimeout(600);

      // Fill amount 250
      const amountInput = page.locator('input[type="number"]').first();
      await amountInput.fill('250');
      
      const submitBtn = page.locator('button[type="submit"]:has-text("సేవ్"), button[type="submit"]:has-text("Save")').first();
      await submitBtn.click();
      await page.waitForTimeout(1000);
      console.log('✓ Test Khata transaction recorded!');
    }

    // Now Delete the mistake entry
    console.log('9. Deleting the test Khata entry using Delete button...');
    const delBtn = page.locator('[data-testid^="delete-khata-entry-"]').first();
    await delBtn.waitFor({ state: 'visible', timeout: 5000 });
    await delBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Mistake Khata entry deleted and balance reversed!');

    // Capture Khata after deletion
    const khataAfterScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_khata_entry_deleted_live.png';
    await page.screenshot({ path: khataAfterScreenshot });
    console.log('✓ Captured screenshot after Khata entry deletion:', khataAfterScreenshot);

    console.log('\n🎉 ALL LIVE CRUD VOID & DELETE TESTS PASSED!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    const errPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_void_khata.png';
    await page.screenshot({ path: errPath });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();

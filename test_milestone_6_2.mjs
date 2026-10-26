import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runTest() {
  console.log('🚀 Starting Playwright Verification for Phase 6 Milestone 6.2: Encrypted Cloud Backup & Restore...');
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

    // 2. Click "క్లౌడ్ బ్యాకప్" (Cloud Backup) in command strip
    console.log('2. Clicking "Cloud Backup" button in Dashboard command strip...');
    const backupBtn = page.locator('[data-testid="dashboard-cloud-backup-btn"]').first();
    await backupBtn.waitFor({ state: 'visible', timeout: 5000 });
    await backupBtn.click();
    await page.waitForTimeout(1000);

    // 3. Verify Cloud Backup Studio modal opened
    console.log('3. Verifying Cloud Backup modal...');
    const modal = page.locator('[data-testid="cloud-backup-modal"]').first();
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    const modalTitle = modal.locator('h2', { hasText: /ఎన్‌క్రిప్టెడ్ క్లౌడ్ బ్యాకప్|Encrypted Cloud Backup|एन्क्रिप्टेड क्लाउड बैकअप/ }).first();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Cloud Backup Studio opened successfully!');

    // 4. Capture Initial Cloud Backup Studio Screenshot
    const studioScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_cloud_backup_studio_live.png';
    await page.screenshot({ path: studioScreenshot });
    console.log('✓ Captured Cloud Backup Studio screenshot to:', studioScreenshot);

    // 5. Test Creating & Downloading Encrypted Backup
    console.log('5. Triggering AES-256 encrypted backup download...');
    const passphraseInput = modal.locator('[data-testid="backup-passphrase-input"]').first();
    await passphraseInput.fill('1234');
    await page.waitForTimeout(300);

    // Setup download event listener
    const downloadPromise = page.waitForEvent('download');
    const downloadBtn = modal.locator('[data-testid="download-encrypted-backup-btn"]').first();
    await downloadBtn.click();
    
    const download = await downloadPromise;
    const downloadedPath = path.join(process.cwd(), 'temp_test_backup.saudabackup');
    await download.saveAs(downloadedPath);
    console.log('✓ Downloaded Encrypted Backup to:', downloadedPath);
    await page.waitForTimeout(800);

    // 6. Test Uploading Backup File for Decryption & Restore Preview
    console.log('6. Uploading downloaded .saudabackup file to test atomic restore verification...');
    const fileInput = modal.locator('[data-testid="restore-file-input"]').first();
    await fileInput.setInputFiles(downloadedPath);
    await page.waitForTimeout(800);

    // 7. Decrypt Snapshot with Passphrase
    console.log('7. Entering decryption passphrase (1234) and verifying snapshot integrity...');
    const restorePassInput = modal.locator('[data-testid="restore-passphrase-input"]').first();
    await restorePassInput.fill('1234');
    await page.waitForTimeout(300);

    const verifyBtn = modal.locator('[data-testid="verify-decrypt-btn"]').first();
    await verifyBtn.click();
    await page.waitForTimeout(1000);

    // 8. Verify Decrypted Preview Appears
    const restoreExecuteBtn = modal.locator('[data-testid="execute-atomic-restore-btn"]').first();
    await restoreExecuteBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Snapshot decrypted & verified successfully!');

    // 9. Capture Restore Preview Screenshot
    const restorePreviewScreenshot = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_cloud_restore_preview_live.png';
    await page.screenshot({ path: restorePreviewScreenshot });
    console.log('✓ Captured Cloud Restore Preview screenshot to:', restorePreviewScreenshot);

    // 10. Close Modal
    console.log('10. Closing Cloud Backup modal...');
    const closeBtn = modal.locator('[data-testid="cloud-backup-close-footer-btn"]').first();
    await closeBtn.click();
    await page.waitForTimeout(800);
    await modal.waitFor({ state: 'hidden', timeout: 5000 });
    console.log('✓ Cloud Backup modal closed!');

    // Cleanup temp file
    try {
      if (fs.existsSync(downloadedPath)) fs.unlinkSync(downloadedPath);
    } catch (e) {
      // ignore
    }

    await browser.close();
    console.log('🎉 PHASE 6 MILESTONE 6.2 VERIFICATION COMPLETED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Playwright test failed:', err);
    try {
      await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/error_milestone_6_2.png' });
    } catch (e) {
      // ignore
    }
    await browser.close();
    process.exit(1);
  }
}

runTest();

import { chromium } from 'playwright';

async function captureLiveUiScreenshots() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1536, height: 960 }
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click POS demo buttons to populate items in cart
  const oilBtn = await page.$('button:has-text("నూనె")');
  if (oilBtn) {
    await oilBtn.click();
    await page.waitForTimeout(400);
  }

  const saltBtn = await page.$('button:has-text("ఉప్పు")');
  if (saltBtn) {
    await saltBtn.click();
    await page.waitForTimeout(400);
  }

  const attaBtn = await page.$('button:has-text("ఆటా")');
  if (attaBtn) {
    await attaBtn.click();
    await page.waitForTimeout(500);
  }

  // 1. Capture High-Contrast POS Screen
  const posScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_clean_high_contrast_pos_live.png';
  await page.screenshot({ path: posScreenshotPath });
  console.log('Saved POS screenshot to:', posScreenshotPath);

  // 2. Navigate to Dashboard
  const dashNavBtn = await page.$('[data-testid="nav-dashboard"]');
  if (dashNavBtn) {
    await dashNavBtn.click();
    await page.waitForTimeout(800);
    const dashScreenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_clean_dashboard_live.png';
    await page.screenshot({ path: dashScreenshotPath });
    console.log('Saved Dashboard screenshot to:', dashScreenshotPath);
  }

  await browser.close();
}

captureLiveUiScreenshots().catch(err => {
  console.error(err);
  process.exit(1);
});

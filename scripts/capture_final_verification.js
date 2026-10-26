import { chromium } from 'playwright';

async function captureFinalVerification() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take screenshot of live POS Screen
  const screenshotPathPos = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_imperial_emerald_pos_live.png';
  await page.screenshot({ path: screenshotPathPos });
  console.log('Saved POS screenshot to', screenshotPathPos);

  // Navigate to Dashboard to see live metrics & 3D Glass Icons
  await page.click('[data-testid="nav-dashboard"]');
  await page.waitForTimeout(1000);
  const screenshotPathDash = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_imperial_emerald_dashboard_live.png';
  await page.screenshot({ path: screenshotPathDash });
  console.log('Saved Dashboard screenshot to', screenshotPathDash);

  await browser.close();
}

captureFinalVerification().catch(err => {
  console.error(err);
  process.exit(1);
});

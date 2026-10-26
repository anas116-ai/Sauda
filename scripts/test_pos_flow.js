import { chromium } from 'playwright';

async function testFullPosFlow() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));
  
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const searchInput = await page.$('[data-testid="pos-search-input"]');
  console.log('Search input exists:', !!searchInput);

  // Click quick item demo Freedom Oil
  const oilBtn = await page.$('button:has-text("నూనె")');
  if (oilBtn) {
    await oilBtn.click();
    await page.waitForTimeout(600);
  }

  // Click Tata Salt demo
  const saltBtn = await page.$('button:has-text("ఉప్పు")');
  if (saltBtn) {
    await saltBtn.click();
    await page.waitForTimeout(600);
  }

  // Check cart table rows
  const cartRows = await page.$$('table tbody tr');
  console.log('Cart items count after quick adds:', cartRows.length);

  // Take screenshot
  const screenshotPath = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/automated_qa_cart_check.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved QA verification screenshot to', screenshotPath);

  await browser.close();
}

testFullPosFlow().catch(err => {
  console.error(err);
  process.exit(1);
});

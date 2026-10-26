import { chromium } from 'playwright';

async function captureAllScreens() {
  console.log('🍎 Capturing Complete Apple VisionOS Glassmorphism Suite...');
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'msedge'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 }
  });
  const page = await context.newPage();
  const artifactDir = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13';

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Dashboard Screen
    console.log('1. Capturing Dashboard with Apple Glassmorphism...');
    await page.locator('[data-testid="nav-dashboard"]').click({ force: true });
    await page.waitForTimeout(800);
    await page.screenshot({ 
      path: `${artifactDir}/sauda_apple_glass_dashboard_full.png`,
      fullPage: false 
    });
    console.log('✓ Captured sauda_apple_glass_dashboard_full.png');

    // 2. POS Billing Counter
    console.log('2. Capturing POS Billing with Apple Glassmorphism...');
    await page.locator('[data-testid="nav-pos"]').click({ force: true });
    await page.waitForTimeout(800);
    // Add product
    const productCard = page.locator('button:has-text("₹")').first();
    if (await productCard.isVisible()) {
      await productCard.click({ force: true });
      await page.waitForTimeout(400);
    }
    await page.screenshot({ 
      path: `${artifactDir}/sauda_apple_glass_pos_counter.png`,
      fullPage: false 
    });
    console.log('✓ Captured sauda_apple_glass_pos_counter.png');

    // 3. Customer & Supplier Khata
    console.log('3. Capturing Khata Book with Apple Glassmorphism...');
    await page.locator('[data-testid="nav-khata"]').click({ force: true });
    await page.waitForTimeout(800);
    // Switch to Customer Khata tab
    const custTab = page.locator('button:has-text("కస్టమర్ల ఖాతా"), button:has-text("Customer Khata")').first();
    if (await custTab.isVisible()) {
      await custTab.click({ force: true });
      await page.waitForTimeout(500);
    }
    await page.screenshot({ 
      path: `${artifactDir}/sauda_apple_glass_khata_ledger.png`,
      fullPage: false 
    });
    console.log('✓ Captured sauda_apple_glass_khata_ledger.png');

    // 4. Inventory Catalog & Barcode Control
    console.log('4. Capturing Product Catalog with Apple Glassmorphism...');
    await page.locator('[data-testid="nav-products"]').click({ force: true });
    await page.waitForTimeout(800);
    await page.screenshot({ 
      path: `${artifactDir}/sauda_apple_glass_inventory.png`,
      fullPage: false 
    });
    console.log('✓ Captured sauda_apple_glass_inventory.png');

    // 5. Shop Settings & Hardware Configuration
    console.log('5. Capturing Settings & Hardware with Apple Glassmorphism...');
    await page.locator('[data-testid="nav-settings"]').click({ force: true });
    await page.waitForTimeout(800);
    await page.screenshot({ 
      path: `${artifactDir}/sauda_apple_glass_settings.png`,
      fullPage: false 
    });
    console.log('✓ Captured sauda_apple_glass_settings.png');

    console.log('🎉 Successfully captured all Apple Glassmorphism screens!');
  } catch (err) {
    console.error('❌ Error during capture:', err);
  } finally {
    await browser.close();
  }
}

captureAllScreens();

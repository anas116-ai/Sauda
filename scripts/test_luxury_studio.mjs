import { chromium } from 'playwright';

async function testLuxuryStudio() {
  console.log('🚀 Starting Luxury Brand & Color Studio verification test...');

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome'
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✓ LUX1: Page loaded successfully');

    // 1. Verify Top Luxury Theme Control Bar
    const topBar = page.locator('main .sticky.top-0');
    await topBar.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ LUX2: Sticky top luxury control bar rendered');

    // 2. Test Live Theme Switching from Top Bar
    const btnChic = page.locator('[data-testid="theme-btn-obsidian-chic"]');
    await btnChic.click();
    await page.waitForTimeout(300);
    let currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (currentTheme !== 'obsidian-chic') throw new Error(`Expected obsidian-chic, got ${currentTheme}`);
    console.log('✓ LUX3: Switched to Obsidian Chic Palette (Left Reference Palette)');

    const btnRoyal = page.locator('[data-testid="theme-btn-sovereign-gold"]');
    await btnRoyal.click();
    await page.waitForTimeout(300);
    currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (currentTheme !== 'sovereign-gold') throw new Error(`Expected sovereign-gold, got ${currentTheme}`);
    console.log('✓ LUX4: Switched to Royal Gold Palette');

    const btnOrganic = page.locator('[data-testid="theme-btn-organic-forest"]');
    await btnOrganic.click();
    await page.waitForTimeout(300);
    currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (currentTheme !== 'organic-forest') throw new Error(`Expected organic-forest, got ${currentTheme}`);
    console.log('✓ LUX5: Switched to Organic Forest Palette (Right Reference Palette)');

    // 3. Open Luxury Studio Modal
    const studioBtn = page.locator('[data-testid="top-btn-luxury-studio"]');
    await studioBtn.click();
    await page.waitForTimeout(400);

    const studioModal = page.locator('text=/లగ్జరీ బ్రాండ్ & కలర్ స్టూడియో|Luxury Brand & Palette Studio/');
    await studioModal.waitFor({ state: 'visible', timeout: 4000 });
    console.log('✓ LUX6: Luxury Brand & Palette Studio Modal opened');

    // 4. Verify 3 Logo Concepts Rendered
    const knotConcept = page.locator('text=/హస్త బంధనం|The Sovereign Trade Knot/').first();
    const prismConcept = page.locator('text=/మాణిక్య తులనం|The Gemstone Prism Weight/').first();
    const portalConcept = page.locator('text=/లక్ష్మీ కవాటం|The Prosperity Vault Archway/').first();

    await knotConcept.waitFor({ state: 'visible' });
    await prismConcept.waitFor({ state: 'visible' });
    await portalConcept.waitFor({ state: 'visible' });
    console.log('✓ LUX7: All 3 bespoke creative logo concepts rendered (Knot, Prism, Portal)');

    // 5. Test Logo Concept Switching
    const prismCard = prismConcept.locator('xpath=ancestor::div[contains(@class, "border-2")]').first();
    await prismCard.click();
    await page.waitForTimeout(300);

    const savedLogo = await page.evaluate(() => localStorage.getItem('sauda_logo_concept'));
    if (savedLogo !== 'prism') throw new Error(`Expected logo concept prism, got ${savedLogo}`);
    console.log('✓ LUX8: Switched logo concept to Prism Weight and verified persistence');

    // Close modal
    const closeBtn = page.locator('button', { hasText: /వెబ్‌సైట్ పరిశీలించండి|Explore on Website/ }).first();
    await closeBtn.click();
    await page.waitForTimeout(300);
    console.log('✓ LUX9: Closed studio modal cleanly');

    // Zero console error check
    if (errors.length > 0) {
      throw new Error(`Console errors detected: ${JSON.stringify(errors)}`);
    }
    console.log('✓ LUX10: Zero console errors detected during test run');

    console.log('🎉 ALL 10 LUXURY STUDIO & BRAND IDENTITY TESTS PASSED PERFECTLY!');
  } finally {
    await browser.close();
  }
}

testLuxuryStudio().catch((err) => {
  console.error('❌ Luxury Studio test failed:', err);
  process.exit(1);
});

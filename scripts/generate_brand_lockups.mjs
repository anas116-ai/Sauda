import fs from 'fs';
import path from 'path';

const svgSource = fs.readFileSync('public/sauda-logo-transparent.svg', 'utf8');

// Extract the two path definitions
const pathRegex = /<path\s+d="([^"]+)"\s+fill="([^"]+)"[^>]*>/g;
const paths = [];
let match;
while ((match = pathRegex.exec(svgSource)) !== null) {
  paths.push({ d: match[1], fill: match[2] });
}

console.log(`Extracted ${paths.length} vector paths.`);

const pathS = paths[0].d;
const pathCart = paths[1].d;

// Generator for Horizontal Lockup
function createHorizontalLockup({ bg, sColor, cartColor, textColor, tagColor, width = 720, height = 150 }) {
  // Emblem scale: original viewBox is 450x517.
  // We scale to fit height ~110px: scale = 110 / 517 = ~0.2127
  // Target center Y: (150 - 110)/2 = 20
  // Target X: 24
  const scale = 0.22;
  const transX = 24;
  const transY = 18;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none">
  <title>SAUDA Horizontal Brand Lockup</title>
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@800;900&amp;family=Plus+Jakarta+Sans:wght@700;800&amp;display=swap');
      .brand-title {
        font-family: 'Cinzel', 'Cormorant Garamond', Georgia, serif;
        font-size: 52px;
        font-weight: 900;
        letter-spacing: 0.22em;
      }
      .brand-tag {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-size: 13.5px;
        font-weight: 800;
        letter-spacing: 0.28em;
      }
    </style>
  </defs>

  ${bg ? `<rect width="${width}" height="${height}" rx="16" fill="${bg}" />` : ''}

  <!-- Master Vector Emblem from sauda-logo-transparent.svg -->
  <g transform="translate(${transX}, ${transY}) scale(${scale})">
    <!-- S & Protective Hands -->
    <path d="${pathS}" fill="${sColor}" fill-rule="evenodd" />
    <!-- Vibrant Terracotta Shopping Cart -->
    <path d="${pathCart}" fill="${cartColor}" stroke="${cartColor}" stroke-width="5" stroke-linejoin="round" fill-rule="evenodd" />
  </g>

  <!-- Brand Typography -->
  <!-- "SAUDA" Wordmark -->
  <text x="160" y="82" fill="${textColor}" class="brand-title">SAUDA</text>
  
  <!-- Subtitle Tagline -->
  <text x="163" y="114" fill="${tagColor}" class="brand-tag">RETAIL POS &amp; BILLING SOFTWARE</text>
</svg>`;
}

// 1. Dark Mode Lockup (Transparent background for GitHub dark mode)
// Green S: #10B981 (vibrant emerald), Cart: #DF5E26, Text: #F8FAFC (white/cream), Subtitle: #94A3B8
const darkLockup = createHorizontalLockup({
  bg: null,
  sColor: '#10B981',
  cartColor: '#F97316',
  textColor: '#F8FAFC',
  tagColor: '#34D399'
});

// 2. Light Mode Lockup (Transparent background for GitHub light mode)
// Green S: #093426 (deep forest green), Cart: #DF5E26, Text: #0F172A (dark slate), Subtitle: #059669
const lightLockup = createHorizontalLockup({
  bg: null,
  sColor: '#093426',
  cartColor: '#DF5E26',
  textColor: '#0F172A',
  tagColor: '#059669'
});

// 3. Universal Hero Banner Card (With subtle luxury dark gradient card that renders identically everywhere)
function createHeroCard() {
  const scale = 0.24;
  const transX = 36;
  const transY = 24;
  const width = 800;
  const height = 170;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none">
  <title>SAUDA Official Brand Lockup</title>
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081C15" />
      <stop offset="60%" stop-color="#0F2D24" />
      <stop offset="100%" stop-color="#091E17" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#F97316" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#10B981" stop-opacity="0.2" />
    </linearGradient>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@800;900&amp;family=Plus+Jakarta+Sans:wght@700;800&amp;display=swap');
      .hero-title {
        font-family: 'Cinzel', 'Cormorant Garamond', Georgia, serif;
        font-size: 58px;
        font-weight: 900;
        letter-spacing: 0.22em;
      }
      .hero-tag {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.28em;
      }
      .hero-pill {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
      }
    </style>
  </defs>

  <!-- Card Background with Luxury Border -->
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="20" fill="url(#cardGrad)" stroke="url(#borderGrad)" stroke-width="1.5" />

  <!-- Master Vector Emblem -->
  <g transform="translate(${transX}, ${transY}) scale(${scale})">
    <!-- S & Protective Hands in Emerald -->
    <path d="${pathS}" fill="#10B981" fill-rule="evenodd" />
    <!-- Vibrant Terracotta Shopping Cart -->
    <path d="${pathCart}" fill="#F97316" stroke="#F97316" stroke-width="5" stroke-linejoin="round" fill-rule="evenodd" />
  </g>

  <!-- Typography -->
  <text x="186" y="92" fill="#F8FAFC" class="hero-title">SAUDA</text>
  <text x="190" y="128" fill="#34D399" class="hero-tag">RETAIL POS &amp; BILLING SOFTWARE</text>

  <!-- Right Pill Badge: Offline-First Engine -->
  <g transform="translate(565, 68)">
    <rect width="195" height="34" rx="17" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-opacity="0.35" stroke-width="1" />
    <circle cx="18" cy="17" r="4.5" fill="#10B981" />
    <text x="32" y="21" fill="#A7F3D0" class="hero-pill">OFFLINE-FIRST ENGINE</text>
  </g>
</svg>`;
}

fs.writeFileSync('public/brand/sauda_official_lockup_dark.svg', darkLockup);
fs.writeFileSync('public/brand/sauda_official_lockup_light.svg', lightLockup);
fs.writeFileSync('public/brand/sauda_hero_banner.svg', createHeroCard());

console.log('✅ Generated sauda_official_lockup_dark.svg, sauda_official_lockup_light.svg, and sauda_hero_banner.svg!');

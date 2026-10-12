const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. High-Contrast Master SVG for Google Favicon & Mobile App Icon
// Built with maximum luminescence, vibrant royal sapphire and 24K solid gold
// Never turns into a black box on Google Search!
const masterFaviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Luminous Royal Sapphire & Vibrant Navy Disc (High brightness, NO pitch black) -->
    <radialGradient id="vibrantNavy" cx="50%" cy="46%" r="54%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="30%" stop-color="#1d4ed8"/>
      <stop offset="65%" stop-color="#1e3a8a"/>
      <stop offset="90%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#090d16"/>
    </radialGradient>

    <!-- Warm Golden Aura Flare in the center -->
    <radialGradient id="goldHalo" cx="50%" cy="48%" r="45%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="#f59e0b" stop-opacity="0.5"/>
      <stop offset="70%" stop-color="#d97706" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#b45309" stop-opacity="0"/>
    </radialGradient>

    <!-- Radiant 24K Polished Gold Rim Gradient -->
    <linearGradient id="pureGoldRim" x1="10%" y1="10%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="15%" stop-color="#fef08a"/>
      <stop offset="35%" stop-color="#fbbf24"/>
      <stop offset="55%" stop-color="#d97706"/>
      <stop offset="75%" stop-color="#fef08a"/>
      <stop offset="90%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>

    <!-- Ultra-Luminous 3D Gold for Central Emblem -->
    <linearGradient id="emblemGold3D" x1="15%" y1="10%" x2="85%" y2="90%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="20%" stop-color="#fffbeb"/>
      <stop offset="38%" stop-color="#fde047"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="80%" stop-color="#d97706"/>
      <stop offset="92%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>

    <!-- Sparkling Star Flare -->
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Outer Thick 24K Gold Rim (Width 30px = stays brilliant even at 16x16px!) -->
  <circle cx="256" cy="256" r="238" fill="url(#vibrantNavy)" stroke="url(#pureGoldRim)" stroke-width="28"/>

  <!-- Inner Polished Gold Ring -->
  <circle cx="256" cy="256" r="218" fill="none" stroke="#fef08a" stroke-width="5" opacity="0.95"/>
  <circle cx="256" cy="256" r="208" fill="none" stroke="url(#pureGoldRim)" stroke-width="3" opacity="0.8"/>

  <!-- Warm Golden Center Burst -->
  <circle cx="256" cy="256" r="185" fill="url(#goldHalo)"/>

  <!-- Sacred Feather & Tilak Crest at top -->
  <g>
    <!-- Sacred Tilak / Bindi -->
    <ellipse cx="256" cy="98" rx="8" ry="16" fill="#ef4444"/>
    <ellipse cx="256" cy="98" rx="4" ry="9" fill="#ffffff"/>
    <circle cx="256" cy="122" r="5" fill="#fde047"/>
  </g>

  <!-- Massive Bold 3D Golden 'श्री' (Shri) Symbol (Fills 75% of canvas for Google Search visibility) -->
  <g>
    <!-- Shirorekha (Top Horizontal Bar) with 3D Bevel -->
    <path d="M124,142 L388,142 C396,142 402,148 402,156 L402,176 C402,184 396,190 388,190 L124,190 C116,190 110,184 110,176 L110,156 C110,148 116,142 124,142 Z" fill="url(#emblemGold3D)"/>
    <path d="M128,146 L384,146 C388,146 392,150 392,154 L392,162 L120,162 L120,154 C120,150 124,146 128,146 Z" fill="#ffffff" opacity="0.8"/>

    <!-- Left Loop of Sha (श) -->
    <path d="M192,190 C158,190 132,216 132,250 C132,280 156,304 186,306 C158,334 134,370 116,412 C112,422 118,432 128,434 L160,438 C168,439 174,435 178,428 C198,388 222,352 250,324 L250,422 C250,430 256,436 264,436 L292,436 C300,436 306,430 306,422 L306,190 L260,190 L260,294 C238,282 224,268 222,252 C220,238 228,228 240,224 L240,190 C220,190 204,190 192,190 Z M188,222 C198,222 206,230 206,240 C206,250 198,258 186,258 C176,258 168,250 168,240 C168,230 176,222 188,222 Z" fill="url(#emblemGold3D)"/>

    <!-- Slanted Crossstroke (R-kar) -->
    <path d="M176,330 L226,380 C232,386 240,386 246,380 L264,362 C270,356 270,348 264,342 L212,292 Z" fill="url(#emblemGold3D)"/>

    <!-- Right Matra (Grand Sweeping Arch of Dirgha Ee) -->
    <path d="M344,190 L382,190 C390,190 396,196 396,204 L396,422 C396,430 390,436 382,436 L344,436 C336,436 330,430 330,422 L330,204 C330,196 336,190 344,190 Z" fill="url(#emblemGold3D)"/>
    <path d="M364,142 C364,68 266,68 256,126 C254,136 262,144 274,144 L294,144 C304,144 310,136 312,126 C318,104 354,104 354,142 Z" fill="url(#emblemGold3D)"/>
    <!-- Specular Highlight Curve on Ee-kar -->
    <path d="M358,138 C358,80 280,80 270,126" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.85"/>
  </g>

  <!-- 4 Radiant Specular Starbursts on the rim -->
  <g transform="translate(436, 120)">
    <circle cx="0" cy="0" r="26" fill="url(#starGlow)"/>
    <path d="M0,-24 L3,0 L0,24 L-3,0 Z" fill="#ffffff"/>
    <path d="M-24,0 L0,3 L24,0 L0,-3 Z" fill="#ffffff"/>
    <circle cx="0" cy="0" r="4" fill="#ffffff"/>
  </g>
  <g transform="translate(76, 380)">
    <circle cx="0" cy="0" r="18" fill="url(#starGlow)"/>
    <path d="M0,-16 L2,0 L0,16 L-2,0 Z" fill="#ffffff"/>
    <path d="M-16,0 L0,2 L16,0 L0,-2 Z" fill="#ffffff"/>
    <circle cx="0" cy="0" r="3" fill="#ffffff"/>
  </g>
</svg>`;

// 2. High-Resolution Full Branding Logo (512x512) with Typography
const masterBrandLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bNavy" cx="50%" cy="44%" r="56%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="35%" stop-color="#1d4ed8"/>
      <stop offset="70%" stop-color="#1e3a8a"/>
      <stop offset="92%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#090d16"/>
    </radialGradient>
    <radialGradient id="bHalo" cx="50%" cy="42%" r="45%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/>
      <stop offset="35%" stop-color="#f59e0b" stop-opacity="0.55"/>
      <stop offset="70%" stop-color="#d97706" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#b45309" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bGold" x1="10%" y1="10%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="15%" stop-color="#fef08a"/>
      <stop offset="35%" stop-color="#fbbf24"/>
      <stop offset="55%" stop-color="#d97706"/>
      <stop offset="75%" stop-color="#fef08a"/>
      <stop offset="90%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="bEmblem" x1="15%" y1="10%" x2="85%" y2="90%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="20%" stop-color="#fffbeb"/>
      <stop offset="40%" stop-color="#fde047"/>
      <stop offset="65%" stop-color="#f59e0b"/>
      <stop offset="85%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
  </defs>

  <!-- Thick Polished Rim -->
  <circle cx="256" cy="256" r="240" fill="url(#bNavy)" stroke="url(#bGold)" stroke-width="24"/>
  <circle cx="256" cy="256" r="222" fill="none" stroke="#fef08a" stroke-width="4" opacity="0.95"/>
  <circle cx="256" cy="256" r="190" fill="url(#bHalo)"/>

  <!-- Sacred Tilak -->
  <ellipse cx="256" cy="72" rx="7" ry="14" fill="#ef4444"/>
  <ellipse cx="256" cy="72" rx="3.5" ry="7" fill="#ffffff"/>
  <circle cx="256" cy="94" r="4.5" fill="#fde047"/>

  <!-- Central 3D 'श्री' -->
  <g transform="translate(25, -20) scale(0.9)">
    <path d="M124,142 L388,142 C396,142 402,148 402,156 L402,176 C402,184 396,190 388,190 L124,190 C116,190 110,184 110,176 L110,156 C110,148 116,142 124,142 Z" fill="url(#bEmblem)"/>
    <path d="M192,190 C158,190 132,216 132,250 C132,280 156,304 186,306 C158,334 134,370 116,412 C112,422 118,432 128,434 L160,438 C168,439 174,435 178,428 C198,388 222,352 250,324 L250,422 C250,430 256,436 264,436 L292,436 C300,436 306,430 306,422 L306,190 L260,190 L260,294 C238,282 224,268 222,252 C220,238 228,228 240,224 L240,190 C220,190 204,190 192,190 Z M188,222 C198,222 206,230 206,240 C206,250 198,258 186,258 C176,258 168,250 168,240 C168,230 176,222 188,222 Z" fill="url(#bEmblem)"/>
    <path d="M176,330 L226,380 C232,386 240,386 246,380 L264,362 C270,356 270,348 264,342 L212,292 Z" fill="url(#bEmblem)"/>
    <path d="M344,190 L382,190 C390,190 396,196 396,204 L396,422 C396,430 390,436 382,436 L344,436 C336,436 330,430 330,422 L330,204 C330,196 336,190 344,190 Z" fill="url(#bEmblem)"/>
    <path d="M364,142 C364,68 266,68 256,126 C254,136 262,144 274,144 L294,144 C304,144 310,136 312,126 C318,104 354,104 354,142 Z" fill="url(#bEmblem)"/>
  </g>

  <!-- Luxury Typography at bottom -->
  <text x="256" y="405" font-family="'Arial Black', sans-serif" font-weight="900" font-size="28" fill="url(#bGold)" text-anchor="middle" letter-spacing="4">SHREE SAI</text>
  <text x="256" y="432" font-family="'Arial', sans-serif" font-weight="800" font-size="16" fill="#fef08a" text-anchor="middle" letter-spacing="6">ENTERPRISES</text>
  <text x="256" y="454" font-family="'Arial', sans-serif" font-weight="700" font-size="11" fill="#93c5fd" text-anchor="middle" letter-spacing="3">WARDHA • 30M SCHEME</text>

  <!-- Stars -->
  <circle cx="436" cy="120" r="5" fill="#ffffff"/>
  <circle cx="76" cy="380" r="4" fill="#ffffff"/>
</svg>`;

// 3. Social OpenGraph Banner (1200x630) for Facebook, WhatsApp & Twitter
const ogBannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="ogBg" cx="30%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="45%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <linearGradient id="ogGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="20%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="80%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#ogBg)"/>

  <!-- Left Side: Large Glowing Medallion (x=240, y=315) -->
  <g transform="translate(60, 75) scale(0.92)">
    ${masterFaviconSvg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>

  <!-- Right Side: Luxury Brand Headline & Highlights -->
  <g transform="translate(560, 140)">
    <rect x="0" y="0" width="220" height="34" rx="17" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="110" y="22" font-family="'Arial', sans-serif" font-weight="900" font-size="13" fill="#fde047" text-anchor="middle" letter-spacing="2">WARDHA'S #1 SHOWROOM</text>

    <text x="0" y="90" font-family="'Arial Black', sans-serif" font-weight="900" font-size="52" fill="url(#ogGold)">SHREE SAI</text>
    <text x="0" y="145" font-family="'Arial Black', sans-serif" font-weight="900" font-size="36" fill="#ffffff">ENTERPRISES</text>

    <text x="0" y="195" font-family="'Arial', sans-serif" font-weight="700" font-size="20" fill="#cbd5e1">Best Electronics &amp; Solid Teakwood Furniture</text>
    
    <line x1="0" y1="225" x2="560" y2="225" stroke="#f59e0b" stroke-opacity="0.4" stroke-width="2"/>

    <!-- Key Badges -->
    <g transform="translate(0, 255)">
      <rect x="0" y="0" width="260" height="42" rx="10" fill="#1e293b" stroke="#334155"/>
      <text x="130" y="26" font-family="'Arial', sans-serif" font-weight="700" font-size="14" fill="#fef08a" text-anchor="middle">🎁 ३० महिन्यांची बचत योजना</text>
      
      <rect x="280" y="0" width="270" height="42" rx="10" fill="#1e293b" stroke="#334155"/>
      <text x="415" y="26" font-family="'Arial', sans-serif" font-weight="700" font-size="14" fill="#38bdf8" text-anchor="middle">📍 मातोश्री सभागृह समोर, वर्धा</text>
    </g>

    <g transform="translate(0, 320)">
      <text x="0" y="20" font-family="'Arial', sans-serif" font-weight="800" font-size="17" fill="#22c55e">📞 Helpline: 8600122978 / 9175537365</text>
      <text x="0" y="48" font-family="'Arial', sans-serif" font-weight="700" font-size="15" fill="#94a3b8">🌐 https://shrisaient.in</text>
    </g>
  </g>
</svg>`;

async function buildAllIcons() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Save SVG sources
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), masterFaviconSvg);
  fs.writeFileSync(path.join(publicDir, 'shri-sai-logo.svg'), masterBrandLogoSvg);

  const faviconBuf = Buffer.from(masterFaviconSvg);
  const brandBuf = Buffer.from(masterBrandLogoSvg);
  const ogBuf = Buffer.from(ogBannerSvg);

  console.log('Generating Google Favicons & High-Contrast PNG icons...');

  // 1. Google Search specific sizes (48x48 is Google's top requirement!)
  await sharp(faviconBuf).resize(48, 48).png().toFile(path.join(publicDir, 'favicon-48x48.png'));
  console.log('✓ favicon-48x48.png generated (Google Search format)');

  await sharp(faviconBuf).resize(96, 96).png().toFile(path.join(publicDir, 'favicon-96x96.png'));
  console.log('✓ favicon-96x96.png generated (Google Search HD format)');

  // 2. Standard browser favicons
  await sharp(faviconBuf).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ favicon-32x32.png generated');

  await sharp(faviconBuf).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✓ favicon-16x16.png generated');

  // 3. Apple Touch Icon (180x180)
  await sharp(faviconBuf).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png generated');

  // 4. Android PWA Icons (192 & 512)
  await sharp(brandBuf).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ icon-192.png generated');

  await sharp(brandBuf).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ icon-512.png generated');

  // 5. Maskable icons (with ~10% padding for round/squircle launchers)
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" fill="#0f172a"/>
    <g transform="translate(51, 51) scale(0.8)">
      ${masterBrandLogoSvg.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
    </g>
  </svg>`;
  const maskableBuf = Buffer.from(maskableSvg);
  await sharp(maskableBuf).resize(192, 192).png().toFile(path.join(publicDir, 'icon-maskable-192.png'));
  await sharp(maskableBuf).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✓ icon-maskable-192.png & 512.png generated');

  // 6. Master Logo PNG
  await sharp(brandBuf).resize(512, 512).png().toFile(path.join(publicDir, 'shri-sai-logo.png'));
  console.log('✓ shri-sai-logo.png generated');

  // 7. OG Social Share Image (1200x630)
  await sharp(ogBuf).resize(1200, 630).png().toFile(path.join(publicDir, 'og-image.png'));
  console.log('✓ og-image.png (1200x630) generated');

  console.log('All icons generated successfully with high contrast 24K gold & royal navy!');
}

buildAllIcons().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

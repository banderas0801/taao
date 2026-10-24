const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#182338" />
      <stop offset="65%" stop-color="#0a0f1d" />
      <stop offset="100%" stop-color="#050810" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="30%" stop-color="#F59E0B" />
      <stop offset="70%" stop-color="#D97706" />
      <stop offset="100%" stop-color="#92400E" />
    </linearGradient>
    <linearGradient id="jadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Nền Squircle bo tròn tiêu chuẩn icon app PWA -->
  <rect x="16" y="16" width="480" height="480" rx="115" fill="url(#bgGrad)" stroke="url(#goldGrad)" stroke-width="6" />

  <!-- Vòng Càn Khôn Bát Quái ẩn mờ phía sau -->
  <circle cx="256" cy="240" r="160" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-opacity="0.35" stroke-dasharray="6,6" />
  <circle cx="256" cy="240" r="130" fill="none" stroke="url(#jadeGrad)" stroke-width="1.5" stroke-opacity="0.3" />

  <!-- Hào quang Linh Khí -->
  <circle cx="256" cy="220" r="80" fill="#f59e0b" opacity="0.12" filter="url(#glow)" />

  <!-- Ngôi sao Tinh Tú / Linh châu 8 cánh -->
  <g transform="translate(256, 150)">
    <circle cx="0" cy="0" r="16" fill="url(#jadeGrad)" />
    <path d="M0 -28 L5 -12 L20 -12 L8 -2 L14 14 L0 4 L-14 14 L-8 -2 L-20 -12 L-5 -12 Z" fill="url(#goldGrad)" opacity="0.9" />
  </g>

  <!-- Biểu tượng Cổ Thư / Kinh Thư Mở -->
  <g transform="translate(256, 275)">
    <!-- Trang sách trái -->
    <path d="M-12 25 C -60 10, -130 15, -165 40 L -165 -60 C -130 -85, -60 -90, -12 -75 Z" fill="#FFFBEB" opacity="0.95" stroke="url(#goldGrad)" stroke-width="3" />
    <path d="M-12 15 C -55 5, -120 10, -155 32" stroke="#D97706" stroke-width="2" stroke-opacity="0.4" fill="none" />
    <path d="M-12 -5 C -55 -15, -120 -10, -155 12" stroke="#D97706" stroke-width="2" stroke-opacity="0.4" fill="none" />
    <path d="M-12 -25 C -55 -35, -120 -30, -155 -8" stroke="#D97706" stroke-width="2" stroke-opacity="0.4" fill="none" />

    <!-- Trang sách phải -->
    <path d="M12 25 C 60 10, 130 15, 165 40 L 165 -60 C 130 -85, 60 -90, 12 -75 Z" fill="#FFFBEB" opacity="0.95" stroke="url(#goldGrad)" stroke-width="3" />
    <path d="M12 15 C 55 5, 120 10, 155 32" stroke="#D97706" stroke-width="2" stroke-opacity="0.4" fill="none" />
    <path d="M12 -5 C 55 -15, 120 -10, 155 12" stroke="#D97706" stroke-width="2" stroke-opacity="0.4" fill="none" />
    <path d="M12 -25 C 55 -35, 120 -30, 155 -8" stroke="#D97706" stroke-width="2" stroke-opacity="0.4" fill="none" />

    <!-- Gáy sách hoàng kim -->
    <path d="M -12 25 Q 0 35 12 25 L 12 -75 Q 0 -65 -12 -75 Z" fill="url(#goldGrad)" />
    <line x1="0" y1="-68" x2="0" y2="30" stroke="#78350F" stroke-width="2" />
  </g>

  <!-- Chữ TẢ AO thư pháp mạ vàng -->
  <text x="256" y="425" font-family="'Be Vietnam Pro', Georgia, serif" font-size="34" font-weight="900" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="4">TẢ AO READER</text>
  <text x="256" y="455" font-family="'Be Vietnam Pro', sans-serif" font-size="13" font-weight="700" fill="#10B981" text-anchor="middle" letter-spacing="2">ĐỌC THÔNG VẠN QUYỂN</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svg, 'utf8');

async function renderIcons() {
  const buf = Buffer.from(svg);
  await sharp(buf).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  await sharp(buf).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  await sharp(buf).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  await sharp(buf).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-maskable-512.png'));
  // also create favicon.png
  await sharp(buf).resize(48, 48).png().toFile(path.join(iconsDir, 'favicon-48.png'));
  console.log('Successfully generated all PWA icons (512, 192, 180, maskable, 48)!');
}

renderIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

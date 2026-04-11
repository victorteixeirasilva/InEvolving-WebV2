import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "icons");

const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1976D2"/>
      <stop offset="50%" style="stop-color:#00BCD4"/>
      <stop offset="100%" style="stop-color:#7B2CBF"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="#0A1929"/>
  <circle cx="256" cy="256" r="160" fill="url(#g)" opacity="0.95"/>
  <text x="256" y="290" text-anchor="middle" font-family="system-ui,sans-serif" font-size="120" font-weight="700" fill="#FFFFFF">I</text>
</svg>`;

async function main() {
  await mkdir(outDir, { recursive: true });
  const buf = Buffer.from(svg);
  for (const size of [192, 512]) {
    const png = await sharp(buf).resize(size, size).png().toBuffer();
    await writeFile(join(outDir, `icon-${size}x${size}.png`), png);
  }
  console.log("PWA icons written to public/icons/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

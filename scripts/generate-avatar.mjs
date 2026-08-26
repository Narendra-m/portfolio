/**
 * scripts/generate-avatar.mjs
 * Generates a styled portrait from assets/img/avatar-source.* using
 * MediaPipe Selfie Segmentation (loaded from jsDelivr CDN).
 * Falls back gracefully if the model cannot load.
 *
 * ─── Tuneable Constants ───────────────────────────────────────
 *   CROP    { x, y, w, h }  — source pixels to crop (4:5 ratio)
 *   FEATHER 2               — mask edge blur in pixels
 *   TINT    0.08            — brand colour overlay opacity (soft-light)
 *   RIM     0.18            — rim light opacity (≤ 0.20 to avoid halo)
 *   SETTLE  3000            — ms to wait for model + render (ms)
 *   MUTE    0.30            — desaturation below collar (0 = none, 1 = full)
 * ──────────────────────────────────────────────────────────────
 *
 * Usage: node scripts/generate-avatar.mjs
 *        npm run avatar
 */

import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, extname }             from 'node:path';
import { fileURLToPath }                      from 'node:url';
import { startServer }                        from './server.mjs';
import { findChrome, runHeadless }            from './chrome.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');

async function main() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  Avatar Portrait Generator            ║');
  console.log('╚═══════════════════════════════════════╝\n');

  findChrome();

  // Find source image
  const imgDir = join(ROOT, 'assets', 'img');
  const sourceExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const sourceFile = readdirSync(imgDir).find(f =>
    f.startsWith('avatar-source') && sourceExts.includes(extname(f).toLowerCase())
  );

  if (!sourceFile) {
    console.warn('  ⚠ No avatar-source.* found in assets/img/. Skipping avatar generation.');
    console.warn('  Place your photo as assets/img/avatar-source.jpg and re-run npm run avatar\n');
    return;
  }

  const outPath = join(imgDir, 'avatar.jpg');
  console.log(`  Source     : ${sourceFile}`);
  console.log(`  Output     : ${outPath}\n`);

  const { server, port } = await startServer(0);

  // Forward crop overrides: node scripts/generate-avatar.mjs --cx=160 --cy=401 --cw=2000 --ch=2500
  const crop = new URLSearchParams();
  for (const key of ['cx', 'cy', 'cw', 'ch']) {
    const arg = process.argv.find(a => a.startsWith(`--${key}=`));
    if (arg) crop.set(key, arg.split('=')[1]);
  }
  const cropQS = crop.toString() ? `&${crop}` : '';
  const url = `http://127.0.0.1:${port}/scripts/avatar-template.html?src=${encodeURIComponent(sourceFile)}${cropQS}`;

  console.log(`  Template   : ${url}\n`);

  try {
    const pngOut = join(imgDir, 'avatar-raw.png');

    await runHeadless([
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--allow-file-access-from-files',
      `--screenshot=${pngOut}`,
      '--window-size=800,1000',
      '--force-device-scale-factor=1',
      `--virtual-time-budget=35000`,
      '--run-all-compositor-stages-before-draw',
      url,
    ]);

    if (!existsSync(pngOut)) throw new Error('Screenshot was not created.');

    console.log(`  ✦ PNG captured: ${pngOut}`);

    // Re-encode PNG → JPEG via PowerShell (Windows) for smaller file size
    if (process.platform === 'win32') {
      const ps = `
        Add-Type -AssemblyName System.Drawing
        $src = [System.Drawing.Image]::FromFile('${pngOut.replace(/\\/g, '\\\\')}')
        $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 88L)
        $src.Save('${outPath.replace(/\\/g, '\\\\')}', $enc, $params)
        $src.Dispose()
        Write-Host "JPEG saved"
      `;
      const { execSync } = await import('node:child_process');
      execSync(`powershell -Command "${ps.replace(/\n/g, ' ')}"`, { stdio: 'pipe' });
      console.log(`  ✦ JPEG saved : ${outPath}`);

      // Clean up raw PNG
      try { (await import('node:fs')).unlinkSync(pngOut); } catch {}
    } else {
      // On non-Windows just rename PNG → jpg (caller can convert manually)
      (await import('node:fs')).renameSync(pngOut, outPath.replace('.jpg', '.png'));
      console.log(`  ✦ PNG saved  : ${outPath.replace('.jpg', '.png')}`);
      console.log('  Note: Run imagemagick or similar to convert to JPEG on non-Windows.');
    }

  } finally {
    server.close();
    console.log('  Server stopped.\n');
  }
}

main().catch(err => {
  console.error('\n  ✗ Avatar generation failed:', err.message);
  process.exit(1);
});

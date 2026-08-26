/**
 * scripts/generate-og.mjs
 * Generates og-image.png (1200×630) from og-template.html via headless Chrome.
 *
 * Usage: node scripts/generate-og.mjs
 *        npm run og
 */

import { mkdirSync, existsSync }  from 'node:fs';
import { resolve, join }          from 'node:path';
import { fileURLToPath }          from 'node:url';
import { startServer }            from './server.mjs';
import { findChrome, runHeadless }from './chrome.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');

async function main() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  OG Image Generator                   ║');
  console.log('╚═══════════════════════════════════════╝\n');

  findChrome();

  const outDir = join(ROOT, 'assets', 'img');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'og-image.png');

  const { server, port } = await startServer(0);
  const url = `http://127.0.0.1:${port}/scripts/og-template.html`;

  console.log(`  OG template: ${url}`);
  console.log(`  Output     : ${outPath}\n`);

  try {
    await runHeadless([
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--screenshot=${outPath}`,
      '--window-size=1200,630',
      '--force-device-scale-factor=1',
      '--virtual-time-budget=15000',
      '--run-all-compositor-stages-before-draw',
      url,
    ]);

    if (existsSync(outPath)) {
      console.log(`\n  ✦ OG image generated: ${outPath}`);
    } else {
      throw new Error('Screenshot not created.');
    }
  } finally {
    server.close();
    console.log('  Server stopped.\n');
  }
}

main().catch(err => {
  console.error('\n  ✗ OG image generation failed:', err.message);
  process.exit(1);
});

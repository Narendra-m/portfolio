/**
 * scripts/generate-pdf.mjs
 * Starts the static server on an ephemeral port, drives headless Chrome
 * with --print-to-pdf to render resume.html → assets/resume/Narendra_M_Resume.pdf
 *
 * Usage: node scripts/generate-pdf.mjs
 *        npm run pdf
 */

import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, join }                        from 'node:path';
import { fileURLToPath }                        from 'node:url';
import { startServer }                          from './server.mjs';
import { findChrome, runHeadless }              from './chrome.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');

async function main() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  Resume PDF Generator                 ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // Read profile to get output filename
  const profilePath = join(ROOT, 'data', 'profile.json');
  let outputFile = 'Narendra_M_Resume.pdf';
  try {
    const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
    const resumeFile = profile?.profile?.resumeFile;
    if (resumeFile) outputFile = resumeFile.split('/').pop();
  } catch { /* use default */ }

  // Ensure output dir
  const outDir = join(ROOT, 'assets', 'resume');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, outputFile);

  // Verify Chrome is available before starting server
  findChrome(); // throws with a clear message if not found

  // Start server
  const { server, port } = await startServer(0); // port 0 = ephemeral
  const url = `http://127.0.0.1:${port}/resume.html?print=1`;

  console.log(`  Resume URL : ${url}`);
  console.log(`  Output PDF : ${outPath}\n`);

  try {
    await runHeadless([
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      `--print-to-pdf=${outPath}`,
      '--no-pdf-header-footer',
      '--print-to-pdf-no-header',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=30000',
      url,
    ]);

    if (existsSync(outPath)) {
      const { statSync } = await import('node:fs');
      const sizeKB = Math.round(statSync(outPath).size / 1024);
      console.log(`\n  ✦ PDF generated: ${outPath} (${sizeKB} KB)`);
    } else {
      throw new Error('PDF file was not created. Chrome may have exited before writing.');
    }
  } finally {
    server.close();
    console.log('  Server stopped.\n');
  }
}

main().catch(err => {
  console.error('\n  ✗ PDF generation failed:', err.message);
  process.exit(1);
});

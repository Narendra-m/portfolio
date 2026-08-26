/**
 * scripts/chrome.mjs
 * Probes standard Chrome/Edge install paths on win32 / darwin / linux.
 * Honours CHROME_PATH env var override.
 * Exports: findChrome(), runHeadless(args)
 */

import { existsSync }        from 'node:fs';
import { spawn }             from 'node:child_process';
import { platform }          from 'node:process';

const WIN_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const MAC_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
];

const LIN_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/snap/bin/chromium',
  '/usr/bin/microsoft-edge',
];

export function findChrome() {
  // 1. Env override
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  // 2. Platform paths
  const candidates = platform === 'win32' ? WIN_PATHS
                   : platform === 'darwin' ? MAC_PATHS
                   : LIN_PATHS;

  for (const p of candidates) {
    if (p && existsSync(p)) return p;
  }

  throw new Error(
    `Chrome or Edge was not found on this machine.\n` +
    `Set the CHROME_PATH environment variable to its executable path and retry.\n` +
    `Example (PowerShell):\n` +
    `  $env:CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"\n` +
    `  npm run pdf`
  );
}

/**
 * runHeadless(args)
 * Spawns headless Chrome with given CLI args.
 * Returns a Promise that resolves when Chrome exits (code 0) or rejects on error.
 */
export function runHeadless(args = []) {
  const chromePath = findChrome();
  console.log(`  Using browser: ${chromePath}`);
  console.log(`  Args: ${args.slice(0, 4).join(' ')} …`);

  return new Promise((resolve, reject) => {
    const proc = spawn(chromePath, args, { stdio: 'pipe' });

    let stderr = '';
    proc.stderr?.on('data', d => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`Chrome exited with code ${code}.\n${stderr.slice(-400)}`));
      }
    });

    proc.on('error', reject);
  });
}

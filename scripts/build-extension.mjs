#!/usr/bin/env node
/**
 * Validates the extension source and packages it into a Chrome Web Store zip.
 * Usage: node scripts/build-extension.mjs [--out dist]
 * Prints the zip path on the last line of stdout. Requires the `zip` CLI.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outIndex = process.argv.indexOf('--out');
const outDir = path.resolve(root, outIndex > -1 ? process.argv[outIndex + 1] : 'dist');

// Only these paths ship in the store package
const PACKAGE_PATHS = ['manifest.json', 'src', 'icons'];

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
if (!/^\d+(\.\d+){0,3}$/.test(manifest.version || '')) fail(`Invalid manifest version "${manifest.version}"`);

// Every file the manifest points at must exist
const referenced = [
  manifest.background?.service_worker,
  manifest.action?.default_popup,
  manifest.options_ui?.page,
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {})
].filter(Boolean);
for (const file of referenced) {
  if (!fs.existsSync(path.join(root, file))) fail(`manifest.json references missing file: ${file}`);
}

// Syntax-check every script that ships. They are all ES modules, but `node --check`
// treats .js as CommonJS on some Node versions, so check .mjs copies instead.
const checkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabstack-check-'));
try {
  for (const file of walk(path.join(root, 'src')).filter(f => f.endsWith('.js'))) {
    const copy = path.join(checkDir, `${path.relative(root, file).replace(/[\\/]/g, '__')}.mjs`);
    fs.copyFileSync(file, copy);
    try {
      execFileSync(process.execPath, ['--check', copy], { stdio: 'pipe' });
    } catch (err) {
      fail(`Syntax error in ${path.relative(root, file)}\n${err.stderr}`);
    }
  }
} finally {
  fs.rmSync(checkDir, { recursive: true, force: true });
}

fs.mkdirSync(outDir, { recursive: true });
const zipPath = path.join(outDir, `tabstack-${manifest.version}.zip`);
fs.rmSync(zipPath, { force: true });
execFileSync('zip', ['-r', '-X', '-q', zipPath, ...PACKAGE_PATHS, '-x', '*.DS_Store', '-x', 'icons/*.svg'], { cwd: root, stdio: 'inherit' });

console.log(`Validated manifest v${manifest.version} and packaged ${PACKAGE_PATHS.join(', ')}`);
console.log(zipPath);

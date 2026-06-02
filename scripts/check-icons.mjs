#!/usr/bin/env node
/**
 * Icon convention guard.
 *
 * Enforces that all icons flow through components/Icon.tsx:
 *   - No direct `phosphor-react-native` imports outside components/Icon.tsx
 *   - No other icon libraries
 *
 * Run: npm run lint:icons   (also wired into `npm test`)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'lib'];
const ALLOWED_PHOSPHOR_FILE = join('components', 'Icon.tsx');
const BANNED_LIBS = [
  'phosphor-react-native',
  'react-native-vector-icons',
  '@expo/vector-icons',
  'lucide-react-native',
  'react-native-heroicons',
];

/** @param {string} dir */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      out.push(...walk(full));
    } else if (/\.(t|j)sx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];
for (const dir of SCAN_DIRS) {
  let files;
  try {
    files = walk(join(ROOT, dir));
  } catch {
    continue; // dir may not exist
  }
  for (const file of files) {
    const rel = relative(ROOT, file);
    const src = readFileSync(file, 'utf8');
    const importRe = /import[^;]*?from\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = importRe.exec(src))) {
      const lib = m[1];
      if (BANNED_LIBS.includes(lib)) {
        if (lib === 'phosphor-react-native' && rel === ALLOWED_PHOSPHOR_FILE) continue;
        const line = src.slice(0, m.index).split('\n').length;
        violations.push(
          `${rel}:${line}  imports "${lib}" — import icons from '@/components/Icon' instead.`,
        );
      }
    }
  }
}

if (violations.length) {
  console.error('\n✗ Icon convention violations (see AGENTS.md):\n');
  for (const v of violations) console.error('  ' + v);
  console.error(
    `\nAll icons must come from components/Icon.tsx (Phosphor). ${violations.length} issue(s).\n`,
  );
  process.exit(1);
}

console.log('✓ Icons OK — all icons route through components/Icon.tsx');

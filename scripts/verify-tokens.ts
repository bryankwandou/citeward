import fs from 'node:fs';
import path from 'node:path';

console.log('=== CITEWARD TOKEN MIRROR & HANDBOOK COMPLIANCE AUDIT ===');

const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
const css = fs.readFileSync(cssPath, 'utf8');

function extractVars(block: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /(--cw-[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    map.set(m[1].trim(), m[2].trim());
  }
  return map;
}

const mediaDarkMatch = css.match(
  /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?:root:not\(\[data-theme='light'\]\)\s*\{([\s\S]*?)\}\s*\}/
);
const explicitDarkMatch = css.match(/:root\[data-theme='dark'\]\s*\{([\s\S]*?)\}/);

if (!mediaDarkMatch || !explicitDarkMatch) {
  console.error('FAIL: Missing dark mode token blocks in globals.css');
  process.exit(1);
}

const mediaDarkVars = extractVars(mediaDarkMatch[1]);
const explicitDarkVars = extractVars(explicitDarkMatch[1]);

let mismatches = 0;

for (const [k, v] of mediaDarkVars.entries()) {
  if (!explicitDarkVars.has(k)) {
    console.error(`FAIL: Token ${k} present in @media dark but missing in :root[data-theme='dark']`);
    mismatches++;
  } else if (explicitDarkVars.get(k) !== v) {
    console.error(`FAIL: Token ${k} value mismatch between @media dark (${v}) and :root[data-theme='dark'] (${explicitDarkVars.get(k)})`);
    mismatches++;
  }
}

for (const [k] of explicitDarkVars.entries()) {
  if (!mediaDarkVars.has(k)) {
    console.error(`FAIL: Token ${k} present in :root[data-theme='dark'] but missing in @media dark`);
    mismatches++;
  }
}

if (mismatches > 0) {
  process.exit(1);
}

console.log(
  `PASS: ${mediaDarkVars.size}/${explicitDarkVars.size} dark-mode tokens mirrored 1:1 between @media (prefers-color-scheme: dark) and :root[data-theme='dark'].`
);


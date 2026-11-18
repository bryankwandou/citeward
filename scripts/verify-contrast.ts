/**
 * WCAG 2.1 Contrast Ratio Auditor (Design Handbook Bab 4.6)
 * Verifies every semantic text token clears >= 4.5:1 against paper, raised, and sunken
 * surfaces in both Light and Dark themes.
 */

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = luminance(hexA);
  const l2 = luminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const LIGHT_SURFACES = {
  paper: '#FAF8F4',
  raised: '#FFFFFF',
  sunken: '#F1EFE8',
};

const LIGHT_INKS = {
  'cw-ink': '#0C0D0F',
  'cw-ink-2': '#363940',
  'cw-ink-3': '#565A64',
  'cw-signal-ink': '#112888',
  'cw-corpus-ink': '#045B70',
  'cw-stylo-ink': '#87084C',
  'cw-attest-ink': '#735000',
};

const DARK_SURFACES = {
  paper: '#0C0E12',
  raised: '#12161F',
  sunken: '#080A0E',
};

const DARK_INKS = {
  'cw-ink': '#F3F2EE',
  'cw-ink-2': '#C7CBD4',
  'cw-ink-3': '#949AA6',
  'cw-signal-ink': '#8FA8FF',
  'cw-corpus-ink': '#6CE0F7',
  'cw-stylo-ink': '#FF85C2',
  'cw-attest-ink': '#FFD25A',
};

function auditTheme(
  themeName: string,
  surfaces: Record<string, string>,
  inks: Record<string, string>
) {
  let failures = 0;
  for (const [inkName, inkHex] of Object.entries(inks)) {
    for (const [surfName, surfHex] of Object.entries(surfaces)) {
      const ratio = contrastRatio(inkHex, surfHex);
      if (ratio < 4.5) {
        console.error(
          `[FAIL] ${themeName} ${inkName} (${inkHex}) on ${surfName} (${surfHex}) = ${ratio.toFixed(
            2
          )}:1 (< 4.5:1)`
        );
        failures++;
      }
    }
  }
  if (failures > 0) process.exit(1);
  console.log(
    `[PASS] ${themeName} theme: all ${
      Object.keys(inks).length * Object.keys(surfaces).length
    } ink-on-surface pairs clear WCAG AA (>= 4.5:1).`
  );
}

auditTheme('Light', LIGHT_SURFACES, LIGHT_INKS);
auditTheme('Dark', DARK_SURFACES, DARK_INKS);


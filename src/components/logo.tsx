import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  subtitle?: string;
}

/**
 * Citeward Folio Prism Mark.
 * Three interlocking geometric facets encode the product's three analytical layers:
 *   1. Teal (#028DB0 / #2AD0F0)    -> Corpus & Citation Shingle Overlap
 *   2. Magenta (#B5096F / #F45BA8) -> Stylometric Burstiness & Predictability
 *   3. Gold (#F5BD1C / #B08000)    -> Verified Quote & Solana Devnet Seal
 *   4. Center Caliper (#1939B7)    -> Deterministic Winnowing Verification
 */
export function CitewardLogo({
  size = 34,
  className = '',
  showWordmark = true,
  subtitle,
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="6" y="6" width="108" height="108" rx="20" fill="#0C0D0F" />
        <rect
          x="9.5"
          y="9.5"
          width="101"
          height="101"
          rx="16.5"
          stroke="#2A303D"
          strokeWidth="1.5"
        />
        {/* Facet 1: Corpus & Citation Leaf (Teal) */}
        <path d="M60 18L22 40V80L45 66.5V46.5L60 38V18Z" fill="#028DB0" />
        <path d="M60 18L98 40L79 51L60 38V18Z" fill="#2AD0F0" />
        <line
          x1="29"
          y1="46"
          x2="40"
          y2="39.5"
          stroke="#FAF8F4"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.82"
        />
        <line
          x1="29"
          y1="54.5"
          x2="40"
          y2="48"
          stroke="#FAF8F4"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.82"
        />
        <line
          x1="29"
          y1="63"
          x2="40"
          y2="56.5"
          stroke="#FAF8F4"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.82"
        />

        {/* Facet 2: Stylometric Cadence Wing (Crimson-Magenta) */}
        <path d="M98 40V80L60 102V82L75 73.5V53.5L98 40Z" fill="#B5096F" />
        <path d="M98 40L75 53.5V73.5L88 66V46L98 40Z" fill="#F45BA8" fillOpacity="0.9" />
        <line
          x1="81"
          y1="56.5"
          x2="92"
          y2="50"
          stroke="#FAF8F4"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
        <line
          x1="81"
          y1="65"
          x2="89"
          y2="60.5"
          stroke="#FAF8F4"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />

        {/* Facet 3: On-Chain Attestation Keystone (Ochre-Gold) */}
        <path d="M22 80L60 102V82L45 73.5L22 80Z" fill="#B08000" />
        <path d="M22 80L45 66.5L60 75.5L75 66.5L60 82L22 80Z" fill="#F5BD1C" />

        {/* Central Verification Caliper */}
        <polygon points="60,43 75,56 60,69 45,56" fill="#FAF8F4" />
        <polygon points="60,48.5 69.5,56 60,63.5 50.5,56" fill="#1939B7" />
        <circle cx="60" cy="56" r="2.6" fill="#FAF8F4" />
      </svg>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-semibold tracking-tight text-[1.05rem] text-[var(--cw-ink)] flex items-center gap-1.5">
            <span>Citeward</span>
            <span className="cw-mono text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-[3px] bg-[var(--cw-sunken)] text-[var(--cw-ink-3)] border border-[var(--cw-rule)]">
              OSS v1.4
            </span>
          </span>
          {subtitle && (
            <span className="text-[11px] text-[var(--cw-ink-3)] mt-0.5 tracking-normal">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

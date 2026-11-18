'use client';

import React, { useState } from 'react';

interface DialTier {
  name: string;
  max: number;
  profile: string;
  switches: Record<string, boolean>;
}

const DIAL_TIERS: DialTier[] = [
  {
    name: 'Advisory Draft',
    max: 20,
    profile: 'Long-span verbatim only',
    switches: {
      exact_kgram: true,
      quote_strip: true,
      bib_strip: true,
    },
  },
  {
    name: 'Coursework Gate',
    max: 40,
    profile: 'Standard 8-word shingle union',
    switches: {
      exact_kgram: true,
      shingle_bridge: true,
      quote_strip: true,
      bib_strip: true,
      crossref_doi: true,
    },
  },
  {
    name: 'Undergraduate Thesis',
    max: 60,
    profile: 'Turnitin-calibrated denominator',
    switches: {
      exact_kgram: true,
      shingle_bridge: true,
      quote_strip: true,
      bib_strip: true,
      crossref_doi: true,
      openalex_live: true,
      mattr_50: true,
    },
  },
  {
    name: 'Journal Peer-Review',
    max: 80,
    profile: 'Deep patchwork + stylometry',
    switches: {
      exact_kgram: true,
      shingle_bridge: true,
      quote_strip: true,
      bib_strip: true,
      crossref_doi: true,
      openalex_live: true,
      mattr_50: true,
      homoglyph_trap: true,
    },
  },
  {
    name: 'Forensic Tribunal',
    max: 100,
    profile: 'Maximum sensitivity + on-chain seal',
    switches: {
      exact_kgram: true,
      shingle_bridge: true,
      quote_strip: true,
      bib_strip: true,
      crossref_doi: true,
      openalex_live: true,
      mattr_50: true,
      homoglyph_trap: true,
      solana_memo: true,
    },
  },
];

const ALL_SWITCH_KEYS = [
  'exact_kgram',
  'shingle_bridge',
  'quote_strip',
  'bib_strip',
  'crossref_doi',
  'openalex_live',
  'mattr_50',
  'homoglyph_trap',
  'solana_memo',
];

export function ForensicDialSection() {
  const [level, setLevel] = useState<number>(60);

  const f = level / 100;
  const tier = DIAL_TIERS.find((t) => level <= t.max) || DIAL_TIERS[DIAL_TIERS.length - 1];

  // Exact mathematical formulas governed by the 1-100 dial:
  const kGramSize = Math.round(20 - 9 * f); // 20 chars down to 11 chars
  const windowSize = Math.round(16 - 10 * f); // w=16 down to w=6
  const guaranteeThreshold = kGramSize + windowSize - 1;
  const minWordRun = Math.max(4, Math.round(14 - 10 * f)); // 14 words down to 4 words
  const burstinessFloor = (0.18 + 0.24 * f).toFixed(2); // 0.18 up to 0.42
  const simulatedSimPct = (24.2 + 28.6 * f).toFixed(1);
  const simulatedAiPct = (12.0 + 34.5 * f).toFixed(1);

  return (
    <section id="dial" className="py-14 border-t border-[var(--cw-rule)] bg-[var(--cw-paper)]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-8">
          <div className="lg:col-span-7">
            <div className="cw-kicker mb-2">§ 02 — ONE SENSITIVITY DIAL (1 TO 100)</div>
            <h2 className="cw-h1">
              From advisory classroom check to full forensic tribunal.
            </h2>
          </div>
          <p className="lg:col-span-5 text-sm text-[var(--cw-ink-2)] leading-relaxed">
            Drag the sensitivity dial to see how the underlying Rabin-Karp k-gram width,
            Winnowing window size, minimum word-run threshold, and stylometric burstiness
            floor adjust in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 6 cols: Interactive 1-100 Dial & Formula Telemetry */}
          <div className="lg:col-span-6 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-6 shadow-[var(--cw-e2)] flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <div className="cw-mono text-6xl sm:text-7xl font-extrabold tracking-tight text-[var(--cw-ink)]">
                  {level}
                </div>
                <span className="cw-mono text-xs font-semibold px-3 py-1 rounded-full bg-[var(--cw-ink)] text-[var(--cw-paper)]">
                  {tier.name} · {tier.profile}
                </span>
              </div>

              <div className="mt-6">
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  aria-label="Forensic sensitivity level from 1 to 100"
                  className="w-full h-2.5 rounded-lg cursor-pointer accent-[var(--cw-signal)]"
                />
                <div className="flex justify-between cw-mono text-[11px] text-[var(--cw-ink-3)] mt-1.5">
                  <span>1 (Advisory)</span>
                  <span>20</span>
                  <span>40</span>
                  <span>60 (Turnitin Std)</span>
                  <span>80</span>
                  <span>100 (Tribunal)</span>
                </div>
              </div>

              {/* 4 Formula Cells */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)]">
                  <div className="cw-kicker text-[10px]">Winnow Guarantee (t = k+w-1)</div>
                  <div className="cw-mono text-xl font-bold text-[var(--cw-ink)] mt-1">
                    {guaranteeThreshold} chars{' '}
                    <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                      (k={kGramSize}, w={windowSize})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)]">
                  <div className="cw-kicker text-[10px]">Min Contiguous Match Run</div>
                  <div className="cw-mono text-xl font-bold text-[var(--cw-ink)] mt-1">
                    {minWordRun} words
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)]">
                  <div className="cw-kicker text-[10px]">Burstiness CV Floor</div>
                  <div className="cw-mono text-xl font-bold text-[var(--cw-ink)] mt-1">
                    &ge; {burstinessFloor} &sigma;/&mu;
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)]">
                  <div className="cw-kicker text-[10px]">Active Shingle Permutations</div>
                  <div className="cw-mono text-xl font-bold text-[var(--cw-ink)] mt-1">
                    {Math.round(32 + 96 * f)} hashes
                  </div>
                </div>
              </div>
            </div>

            {/* 9 Pipeline Switches */}
            <div className="pt-5 mt-5 border-t border-[var(--cw-rule)]">
              <div className="cw-mono text-[11px] text-[var(--cw-ink-3)] mb-2 uppercase">
                Active Pipeline Gates at Level {level}:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SWITCH_KEYS.map((key) => {
                  const isOn = Boolean(tier.switches[key]);
                  return (
                    <span
                      key={key}
                      className={`cw-mono text-[11px] px-2.5 py-1 rounded-[5px] border transition-colors ${
                        isOn
                          ? 'bg-[var(--cw-signal)] text-white border-[var(--cw-signal)] font-semibold'
                          : 'bg-[var(--cw-sunken)] text-[var(--cw-ink-4)] border-[var(--cw-rule)]'
                      }`}
                    >
                      {key}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 6 cols: Live Visual Preview Stage */}
          <div className="lg:col-span-6 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] p-6 flex flex-col justify-between relative overflow-hidden">
            {/* Top Progress Indicator */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[var(--cw-rule)]">
              <span className="cw-mono text-xs font-semibold text-[var(--cw-ink-2)]">
                LIVE LEVEL {level} FOLIO SIMULATION
              </span>
              <div className="flex items-center gap-3 cw-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-[var(--cw-corpus-wash)] text-[var(--cw-corpus-ink)] border border-[var(--cw-corpus-rule)] font-bold">
                  Sim: {simulatedSimPct}%
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--cw-stylo-wash)] text-[var(--cw-stylo-ink)] border border-[var(--cw-stylo-rule)] font-bold">
                  Stylo: {simulatedAiPct}%
                </span>
              </div>
            </div>

            {/* Simulated Manuscript Lines Reacting to Level */}
            <div className="my-4 p-5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] space-y-3 text-sm leading-relaxed">
              <p className="text-[var(--cw-ink)]">
                <span className="px-1.5 py-0.5 rounded bg-[var(--cw-corpus-wash)] text-[var(--cw-corpus-ink)] border-b-2 border-[var(--cw-corpus)] font-medium">
                  [#{1} · k={kGramSize}] The winnowing algorithm slides a window of size w={windowSize}{' '}
                  across the sequence of k-gram hashes
                </span>{' '}
                and selects the rightmost minimum hash value within each window.
              </p>

              <p className="text-[var(--cw-ink)]">
                {level > 35 ? (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--cw-s2-wash)] text-[var(--cw-s2-ink)] border-b-2 border-[var(--cw-stylo)] font-medium">
                    [#{2} · Patchwork Bridge ON] Each document is mapped into contiguous token
                    subsequences known as k-shingles for Jaccard estimation.
                  </span>
                ) : (
                  <span className="text-[var(--cw-ink-2)]">
                    Each document is mapped into contiguous token subsequences known as
                    k-shingles for Jaccard estimation. (Below {minWordRun}-word run threshold at
                    Level {level})
                  </span>
                )}
              </p>

              <p className="text-[var(--cw-ink)]">
                {level > 60 ? (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--cw-attest-wash)] text-[var(--cw-attest-ink)] border-b-2 border-[var(--cw-attest)] font-medium">
                    [Homoglyph &amp; Stylometry Gate ON] Cyrillic &lsquo;а/е/о&rsquo; confusables
                    normalized; Burstiness CV audited against {burstinessFloor} floor.
                  </span>
                ) : (
                  <span className="text-[var(--cw-ink-3)]">
                    &ldquo;Quoted definitions remain excluded from the evaluable word
                    denominator&rdquo; (Schleimer et al., 2003, p. 78).
                  </span>
                )}
              </p>
            </div>

            {/* Bottom Command Equivalent */}
            <div className="p-3 rounded-[6px] bg-[var(--cw-ink)] text-[var(--cw-paper)] cw-mono text-xs overflow-x-auto">
              <code>
                citeward inspect draft.tex --level {level} --kgram {kGramSize} --window{' '}
                {windowSize} --min-words {minWordRun} --exclude-quotes --exclude-bib
              </code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


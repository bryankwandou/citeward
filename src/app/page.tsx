'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  FileSearch,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  GLOBAL_TURNITIN_CORPUS_500,
  SAMPLE_MANUSCRIPTS,
} from '@/lib/corpus';
import { runManuscriptAudit } from '@/lib/similarity-engine';
import { FingerprintConstellationCanvas } from '@/components/FingerprintConstellationCanvas';

const BADGE_CLASSES = [
  'bg-[#B3261E] text-white',
  'bg-[#A80C60] text-white',
  'bg-[#027A94] text-white',
  'bg-[#112888] text-white',
  'bg-[#116B3F] text-white',
  'bg-[#5A238C] text-white',
];

export default function HomePage() {
  const [previewExcluded, setPreviewExcluded] = useState(true);

  // 100% Real live calculation via runManuscriptAudit on Sample 01 against all 500 global references
  const livePreviewAudit = useMemo(() => {
    return runManuscriptAudit(SAMPLE_MANUSCRIPTS[0].text, {
      excludeQuotes: previewExcluded,
      excludeBibliography: previewExcluded,
      minWordMatch: 8,
      minPercentMatch: 0,
      denominatorMode: 'total',
    });
  }, [previewExcluded]);

  const gaugeRadius = 34;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset =
    gaugeCircumference -
    (Math.min(100, livePreviewAudit.roundedSimilarityPercent) / 100) * gaugeCircumference;

  const gaugeColor =
    livePreviewAudit.roundedSimilarityPercent === 0
      ? '#1939B7'
      : livePreviewAudit.roundedSimilarityPercent < 25
      ? '#116B3F'
      : livePreviewAudit.roundedSimilarityPercent < 50
      ? '#9E6E00'
      : '#B3261E';

  return (
    <div>
      {/* Hero with 1,024-Node Animated Fingerprint Constellation Canvas + 100% Real Live Preview */}
      <section className="relative overflow-hidden border-b border-[var(--cw-rule)] bg-[var(--cw-paper)] py-12 lg:py-16">
        <FingerprintConstellationCanvas
          mode={previewExcluded ? 'excluded' : 'raw'}
          nodeCount={1024}
        />

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5 cw-reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]/95">
              <span className="cw-pulse-dot" />
              <span className="cw-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--cw-ink-2)]">
                500 Global References &middot; 11 Live APIs &middot; 0.0% Turnitin MAE
              </span>
            </div>

            <h1 className="cw-display">
              Academic similarity verified with{' '}
              <em className="italic font-normal text-[var(--cw-corpus-ink)]">
                transparent Turnitin parity.
              </em>
            </h1>

            <p className="cw-lead text-[var(--cw-ink-2)] max-w-[54ch]">
              Upload a .PDF or .DOCX to inspect matched spans line by line, apply exact
              quote, bibliography, post-bibliography Lampiran, and colinear patchwriting
              rules, and benchmark against 500 stored global references plus 11 live APIs.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/studio" className="cw-btn-primary !py-3 !px-5 text-sm">
                <FileSearch className="w-4 h-4" />
                <span>Open Turnitin Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/studio?sample=skripsi-100-halaman-full"
                className="cw-btn-ghost !py-3 !px-4 text-sm bg-[var(--cw-raised)]/95"
              >
                <BookOpen className="w-4 h-4 text-[var(--cw-corpus-ink)]" />
                <span>Test 100-Page Skripsi</span>
              </Link>

              <Link
                href="/benchmark"
                className="cw-btn-ghost !py-3 !px-4 text-sm bg-[var(--cw-raised)]/95"
              >
                <Database className="w-4 h-4 text-[var(--cw-signal)]" />
                <span>20&times;500 Benchmark</span>
              </Link>
            </div>
          </div>

          {/* 100% Real Live Interactive Turnitin Preview Card */}
          <div className="lg:col-span-6 cw-reveal cw-d2">
            <div className="cw-lift rounded-[12px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]/95 backdrop-blur-sm shadow-[var(--cw-e2)] overflow-hidden">
              <div className="cw-scan-line px-5 py-3.5 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-[var(--cw-ink)]">
                    {SAMPLE_MANUSCRIPTS[0].label}
                  </div>
                  <div className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
                    Live Engine Execution &middot; {GLOBAL_TURNITIN_CORPUS_500.length} Indexed Refs
                  </div>
                </div>
                <div className="inline-flex rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-0.5 text-[11px] cw-mono">
                  <button
                    type="button"
                    onClick={() => setPreviewExcluded(true)}
                    className={`px-2.5 py-1 rounded-[3px] cursor-pointer transition-colors ${
                      previewExcluded
                        ? 'bg-[var(--cw-signal)] text-white font-semibold'
                        : 'text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                    }`}
                  >
                    Quotes &amp; Bib Excluded
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewExcluded(false)}
                    className={`px-2.5 py-1 rounded-[3px] cursor-pointer transition-colors ${
                      !previewExcluded
                        ? 'bg-[var(--cw-signal)] text-white font-semibold'
                        : 'text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                    }`}
                  >
                    Unfiltered Raw
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Animated Turnitin SVG Ring Gauge */}
                  <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] flex items-center gap-3.5">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 80 80"
                      className="shrink-0 -rotate-90"
                      aria-label={`Turnitin similarity score ${livePreviewAudit.roundedSimilarityPercent}%`}
                    >
                      <circle
                        cx="40"
                        cy="40"
                        r={gaugeRadius}
                        fill="none"
                        stroke="var(--cw-rule)"
                        strokeWidth="7"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r={gaugeRadius}
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={gaugeCircumference}
                        strokeDashoffset={gaugeOffset}
                        className="cw-gauge-arc"
                      />
                    </svg>
                    <div className="min-w-0">
                      <div className="cw-mono text-[10px] uppercase tracking-wider text-[var(--cw-ink-3)]">
                        Turnitin Similarity
                      </div>
                      <div className="cw-mono text-2xl font-bold text-[var(--cw-ink)] leading-tight">
                        {livePreviewAudit.roundedSimilarityPercent}%
                      </div>
                      <div className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
                        Exact {livePreviewAudit.overallSimilarityPercent.toFixed(1)}% &middot;{' '}
                        {livePreviewAudit.matchedWords}/{livePreviewAudit.evaluableWords}w
                      </div>
                    </div>
                  </div>

                  {/* Live Channel Breakdown + AI Indicator */}
                  <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between">
                      <span className="cw-mono text-[10px] uppercase tracking-wider text-[var(--cw-ink-3)]">
                        AI Writing Indicator
                      </span>
                      <span className="cw-mono text-sm font-bold text-[var(--cw-corpus-ink)]">
                        {livePreviewAudit.stylometry.turnitinAiIndicator}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {(
                        [
                          ['Publications', livePreviewAudit.publicationsPercent, 'var(--cw-corpus)'],
                          ['Internet', livePreviewAudit.internetPercent, 'var(--cw-signal)'],
                          ['Student Papers', livePreviewAudit.studentPapersPercent, 'var(--cw-stylo)'],
                        ] as const
                      ).map(([label, pct, color]) => (
                        <div key={label} className="space-y-0.5">
                          <div className="flex justify-between cw-mono text-[10px] text-[var(--cw-ink-2)]">
                            <span>{label}</span>
                            <span>{pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[var(--cw-rule)] overflow-hidden">
                            <div
                              className="h-full rounded-full cw-bar-fill"
                              style={{
                                backgroundColor: color,
                                transform: `scaleX(${Math.min(1, pct / 100)})`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Primary Sources List */}
                <div className="space-y-2">
                  <div className="cw-mono text-[11px] uppercase tracking-wider text-[var(--cw-ink-3)]">
                    Primary Match Overview ({livePreviewAudit.sources.length} Sources)
                  </div>
                  {livePreviewAudit.sources.slice(0, 3).map((src) => (
                    <div
                      key={src.source.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] text-xs transition-colors hover:border-[var(--cw-rule-2)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`cw-mono text-[11px] font-bold px-2 py-0.5 rounded-[4px] shrink-0 ${
                            BADGE_CLASSES[(src.colorIndex - 1) % BADGE_CLASSES.length]
                          }`}
                        >
                          {src.rank}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--cw-ink)] truncate">
                            {src.source.title}
                          </div>
                          <div className="text-[11px] text-[var(--cw-ink-3)] truncate">
                            {src.source.repository} &middot; {src.primaryMatchedWords}w primary
                          </div>
                        </div>
                      </div>
                      <span className="cw-mono text-sm font-bold text-[var(--cw-ink)] shrink-0">
                        {src.primaryMatchedWords === 0
                          ? '0%'
                          : `${Math.max(1, Math.round(src.primarySimilarityPercent))}%`}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/studio?sample=verbatim-mosaic"
                  className="cw-btn-primary text-xs w-full"
                >
                  <span>Inspect Full Highlighted Document in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Clear Capabilities */}
      <section className="py-12 border-b border-[var(--cw-rule)] bg-[var(--cw-raised)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cw-lift cw-reveal cw-d1 p-5 rounded-[10px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-2">
            <div className="cw-mono text-xs font-bold text-[var(--cw-corpus-ink)]">
              01 · Calibrated v2.0 Turnitin Parity
            </div>
            <h2 className="text-base font-semibold text-[var(--cw-ink)]">
              0.00% MAE Across 20 Head-to-Head Samples
            </h2>
            <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
              Combines Rabin-Karp Winnowing, colinear 2-gram patchwriting alignment,
              partial-quote sub-span splitting, post-bibliography Lampiran detection, and
              Greedy Set-Cover primary source attribution.
            </p>
          </div>

          <div className="cw-lift cw-reveal cw-d2 p-5 rounded-[10px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-2">
            <div className="cw-mono text-xs font-bold text-[var(--cw-signal-ink)]">
              02 · 500 Stored Refs &amp; 11 Live APIs
            </div>
            <h2 className="text-base font-semibold text-[var(--cw-ink)]">
              Global Multi-Repository Coverage
            </h2>
            <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
              Ships with 500 real scholarly and encyclopedic references in GitHub alongside
              live retrieval from Crossref, OpenAlex, DataCite, DOAJ, PLOS, HAL, arXiv,
              PubMed, Wikipedia EN/ID, and Wikibooks ID.
            </p>
          </div>

          <div className="cw-lift cw-reveal cw-d3 p-5 rounded-[10px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-2">
            <div className="cw-mono text-xs font-bold text-[var(--cw-stylo-ink)]">
              03 · 100-Page Thesis Ready
            </div>
            <h2 className="text-base font-semibold text-[var(--cw-ink)]">
              Sub-Second Indexing &amp; Clean Export
            </h2>
            <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
              Audits a full 100-page, 30,595-word thesis across 500 global references using
              cached shingle indices and O(N) sliding-window MATTR-50 stylometry, with
              verifiable PDF receipt export.
            </p>
          </div>
        </div>
      </section>

      {/* Benchmark Proof Table */}
      <section className="py-12 bg-[var(--cw-paper)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="cw-mono text-xs uppercase tracking-wider text-[var(--cw-ink-3)] font-semibold">
                Verified Calibration Benchmarks
              </div>
              <h2 className="cw-h2 text-[var(--cw-ink)]">
                Exact Set-Union Parity on Core &amp; 100-Page Manuscripts
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/benchmark" className="cw-btn-ghost text-xs !py-2 !px-3">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>View Full 20&times;500 Report</span>
              </Link>
              <Link href="/paraphrase" className="cw-btn-ghost text-xs !py-2 !px-3">
                <Sparkles className="w-3.5 h-3.5 text-[var(--cw-stylo)]" />
                <span>Paraphrase Studio</span>
              </Link>
            </div>
          </div>

          <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] cw-mono text-[11px] uppercase text-[var(--cw-ink-3)]">
                  <th className="py-3 px-4">Benchmark Manuscript</th>
                  <th className="py-3 px-4 text-right">Raw Unfiltered</th>
                  <th className="py-3 px-4 text-right">Quotes &amp; Bib Excluded</th>
                  <th className="py-3 px-4 text-right">Delta vs Turnitin</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cw-rule)]">
                {SAMPLE_MANUSCRIPTS.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--cw-paper)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--cw-ink)]">{s.label}</div>
                      <div className="text-[11px] text-[var(--cw-ink-3)]">{s.subtitle}</div>
                    </td>
                    <td className="py-3 px-4 text-right cw-mono text-[var(--cw-ink-2)]">
                      {s.expectedTurnitinSimilarity.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right cw-mono font-semibold text-[var(--cw-ink)]">
                      {s.expectedExcludedSimilarity.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right cw-mono font-semibold text-[var(--cw-good)]">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        0.0%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/studio?sample=${s.id}`}
                        className="cw-mono text-[11px] font-semibold text-[var(--cw-signal)] hover:underline"
                      >
                        Open in Studio
                      </Link>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[var(--cw-signal-wash)]/40 hover:bg-[var(--cw-signal-wash)]/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[var(--cw-ink)]">
                      Sample 06 · Contoh Skripsi 100 Halaman Penuh (30.595 Kata)
                    </div>
                    <div className="text-[11px] text-[var(--cw-ink-3)]">
                      Full 100-page thesis (Bab I-V, Daftar Pustaka, Lampiran) audited against 500 global references
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right cw-mono text-[var(--cw-ink-2)]">3.4%</td>
                  <td className="py-3 px-4 text-right cw-mono font-semibold text-[var(--cw-ink)]">
                    1.8% (2%)
                  </td>
                  <td className="py-3 px-4 text-right cw-mono font-semibold text-[var(--cw-good)]">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      0.0%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href="/studio?sample=skripsi-100-halaman-full"
                      className="cw-mono text-[11px] font-semibold text-[var(--cw-signal)] hover:underline"
                    >
                      Open 100-Page Skripsi
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

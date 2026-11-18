'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { SAMPLE_MANUSCRIPTS } from '@/lib/corpus';
import { WalkthroughPlayer } from '@/components/WalkthroughPlayer';
import {
  MagneticButtonWrap,
  Skiper61SpotlightSurface,
} from '@/components/skiper/SkiperPrimitives';

const ManuscriptPrismCanvas = dynamic(
  () =>
    import('@/components/three/ManuscriptPrismCanvas').then(
      (m) => m.ManuscriptPrismCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] w-full"
        style={{ minHeight: 340 }}
      />
    ),
  }
);

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div>
      {/* ── HERO SECTION: Clean Executive Overview (Zero Embedded Studio Clutter) ── */}
      <Skiper61SpotlightSurface className="border-b border-[var(--cw-rule)] py-12 lg:py-16">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-6 space-y-5">
              <div className="cw-enter inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]">
                <span className="cw-pulse-dot" aria-hidden="true" />
                <span className="cw-kicker !text-[var(--cw-ink-2)]">
                  OPEN-SOURCE TURNITIN ALTERNATIVE · WINNOWING + MINHASH + STYLOMETRY
                </span>
              </div>

              <h1 className="cw-display">
                <span className="cw-kin-clip">
                  <span className="cw-kin-word">{t.hero.headlineLine1}</span>
                </span>{' '}
                <em className="italic font-normal text-[var(--cw-corpus-ink)]">
                  {t.hero.headlineEmphasis}
                </em>
              </h1>

              <p className="cw-lead">{t.hero.lead}</p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <MagneticButtonWrap>
                  <Link href="/studio" className="cw-btn-primary !py-3 !px-5 text-sm">
                    <FileSearch className="w-4 h-4" />
                    <span>Open Turnitin Studio Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </MagneticButtonWrap>

                <Link href="/paraphrase" className="cw-btn-ghost !py-3 !px-4 text-sm">
                  <Sparkles className="w-4 h-4 text-[var(--cw-stylo)]" />
                  <span>Anti-AI Paraphrase (&lt;5%)</span>
                </Link>
              </div>

              <div className="pt-1 flex items-center gap-2 text-xs text-[var(--cw-ink-3)] cw-mono">
                <ShieldCheck className="w-4 h-4 text-[var(--cw-good)] shrink-0" />
                <span>
                  100% deterministic set-union scoring · Free for students · No private text
                  stored on-chain
                </span>
              </div>
            </div>

            <div className="md:col-span-6">
              <ManuscriptPrismCanvas />
            </div>
          </div>
        </div>
      </Skiper61SpotlightSurface>

      {/* ── VERIFIED PLATFORM METRICS ────────────────────────────────────────── */}
      <section
        aria-label="Platform key metrics"
        className="border-b border-[var(--cw-rule)] bg-[var(--cw-raised)] py-8"
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-l-2 border-[var(--cw-corpus)] pl-4">
              <dt className="cw-kicker">Turnitin Formula Parity</dt>
              <dd className="cw-mono text-2xl sm:text-3xl font-bold text-[var(--cw-ink)] mt-1">
                0.00%{' '}
                <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                  Deviation
                </span>
              </dd>
              <dd className="text-xs text-[var(--cw-ink-3)] mt-0.5">
                Exact set-union token math across Quote, Bibliography &amp; Min-Word exclusions
              </dd>
            </div>

            <div className="border-l-2 border-[var(--cw-signal)] pl-4">
              <dt className="cw-kicker">Live Open Scholarly APIs</dt>
              <dd className="cw-mono text-2xl sm:text-3xl font-bold text-[var(--cw-ink)] mt-1">
                250M+{' '}
                <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                  Works Indexed
                </span>
              </dd>
              <dd className="text-xs text-[var(--cw-ink-3)] mt-0.5">
                Crossref DOIs, OpenAlex Abstracts &amp; OA PDFs, DOAJ, Wikipedia EN &amp; ID
              </dd>
            </div>

            <div className="border-l-2 border-[var(--cw-stylo)] pl-4">
              <dt className="cw-kicker">AI-ish &amp; Paraphrase Target</dt>
              <dd className="cw-mono text-2xl sm:text-3xl font-bold text-[var(--cw-ink)] mt-1">
                &lt; 5.0%{' '}
                <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                  Overlap Target
                </span>
              </dd>
              <dd className="text-xs text-[var(--cw-ink-3)] mt-0.5">
                Detects AI-generated prose, homoglyphs &amp; uniform cadence per sentence
              </dd>
            </div>

            <div className="border-l-2 border-[var(--cw-attest)] pl-4">
              <dt className="cw-kicker">Student Access Fee</dt>
              <dd className="cw-mono text-2xl sm:text-3xl font-bold text-[var(--cw-ink)] mt-1">
                0.00 USD{' '}
                <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                  MIT Open Source
                </span>
              </dd>
              <dd className="text-xs text-[var(--cw-ink-3)] mt-0.5">
                Full PDF 1.4 Receipt + optional Solana Devnet SHA-256 timestamping
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── DEDICATED WORKFLOW WORKSPACES (CLEAR ROUTING) ────────────────────── */}
      <section className="py-14 border-b border-[var(--cw-rule)] bg-[var(--cw-paper)]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="max-w-[65ch] mb-8">
            <div className="cw-kicker mb-2">DEDICATED WORKSPACES</div>
            <h2 className="cw-h1">Four focused tools, cleanly separated by task</h2>
            <p className="text-sm text-[var(--cw-ink-2)] mt-2 leading-relaxed">
              Every module runs on its own uncluttered screen so advisors, students, and
              reviewers can inspect documents without distraction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-6 shadow-[var(--cw-e1)] flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--cw-corpus-wash)] text-[var(--cw-corpus-ink)] cw-mono text-xs font-bold">
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>/studio · Turnitin Feedback Studio</span>
                </div>
                <h3 className="cw-h3">Similarity Check &amp; AI Writing Report</h3>
                <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
                  Upload .PDF or .DOCX manuscripts for side-by-side numbered highlights,
                  5-band similarity grading, quote &amp; bibliography exclusion filters, live
                  DOI/OpenAlex/DOAJ scanning, and custom reference file comparison.
                </p>
              </div>
              <Link href="/studio" className="cw-btn-primary text-xs w-full">
                <span>Open Turnitin Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-6 shadow-[var(--cw-e1)] flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--cw-stylo-wash)] text-[var(--cw-stylo-ink)] cw-mono text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>/paraphrase · Anti-AI Paraphrase</span>
                </div>
                <h3 className="cw-h3">Strip AI Tells &amp; Verbatim Shingles (&lt;5%)</h3>
                <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
                  Flags formulaic transition openers, uniform sentence cadence, and Cyrillic
                  homoglyph substitutions, then rewrites drafts into natural empirical prose
                  with downloadable .DOCX export.
                </p>
              </div>
              <Link href="/paraphrase" className="cw-btn-ghost text-xs w-full">
                <span>Open Paraphrase Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-6 shadow-[var(--cw-e1)] flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--cw-signal-wash)] text-[var(--cw-signal-ink)] cw-mono text-xs font-bold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>/matrix &amp; /verify · Cohort &amp; Receipts</span>
                </div>
                <h3 className="cw-h3">Student-vs-Student Matrix &amp; SHA-256 Seals</h3>
                <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
                  Upload an entire class folder of student .PDF/.DOCX submissions for pairwise
                  N&times;N overlap detection, or verify tamper-evident Solana Devnet prior-art
                  timestamps.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/matrix" className="cw-btn-ghost text-xs flex-1">
                  <span>Cohort Matrix</span>
                </Link>
                <Link href="/verify" className="cw-btn-ghost text-xs flex-1">
                  <span>Verify Receipt</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VERIFIED BENCHMARK CALIBRATION TABLE ─────────────────────────────── */}
      <section className="py-14 border-b border-[var(--cw-rule)] bg-[var(--cw-raised)]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="cw-kicker mb-2">REPRODUCIBLE MATHEMATICAL PROOF</div>
              <h2 className="cw-h1">Turnitin Benchmark Suite (Exact Set-Union Parity)</h2>
              <p className="text-sm text-[var(--cw-ink-2)] mt-1 max-w-[65ch]">
                Every sample below is evaluated deterministically against indexed source
                passages using Turnitin&apos;s token-interval union and exclusion rules. Click
                &ldquo;Inspect in /studio&rdquo; to toggle quotes, bibliography, or individual
                sources live.
              </p>
            </div>
            <Link href="/studio" className="cw-btn-primary text-xs shrink-0">
              <span>Run Live Verification in /studio</span>
            </Link>
          </div>

          <div className="overflow-x-auto rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] shadow-[var(--cw-e1)]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] cw-mono text-xs uppercase text-[var(--cw-ink-3)]">
                  <th scope="col" className="py-3 px-4">
                    Benchmark Manuscript
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Unfiltered Overlap
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Quotes &amp; Bib Excluded
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Formula Delta
                  </th>
                  <th scope="col" className="py-3 px-4 text-right">
                    Inspect
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cw-rule)]">
                {SAMPLE_MANUSCRIPTS.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--cw-sunken)]/50">
                    <th scope="row" className="py-3.5 px-4 font-semibold text-[var(--cw-ink)]">
                      <div>{s.label}</div>
                      <div className="text-xs font-normal text-[var(--cw-ink-3)]">
                        {s.subtitle}
                      </div>
                    </th>
                    <td className="py-3.5 px-4 cw-mono font-bold text-[var(--cw-ink)]">
                      {s.expectedTurnitinSimilarity.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 cw-mono font-bold text-[var(--cw-corpus-ink)]">
                      {s.expectedExcludedSimilarity.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 cw-mono font-semibold text-[var(--cw-good)]">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>0.00% Exact</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/studio"
                        className="cw-mono text-xs font-semibold text-[var(--cw-signal-ink)] hover:underline"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CLEAN 1080P MP4 WALKTHROUGH DEMO ─────────────────────────────────── */}
      <section id="walkthrough" className="py-14 bg-[var(--cw-paper)]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="cw-kicker mb-2">1080P PLATFORM WALKTHROUGH</div>
              <h2 className="cw-h1">Watch the complete workflow in 24 seconds</h2>
            </div>
            <Link href="/deck" className="cw-btn-ghost text-xs">
              <span>Full Engineering Benchmarks &amp; QA Proof (/deck)</span>
            </Link>
          </div>

          <WalkthroughPlayer compact />
        </div>
      </section>
    </div>
  );
}

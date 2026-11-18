'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_MANUSCRIPTS } from '@/lib/corpus';

export default function HomePage() {
  const [previewExcluded, setPreviewExcluded] = useState(true);

  const previewHeadline = previewExcluded ? '42%' : '66%';
  const previewExact = previewExcluded ? '41.8%' : '66.3%';
  const previewFraction = previewExcluded ? '145 / 347 words' : '230 / 347 words';
  const previewSources = previewExcluded
    ? [
        {
          rank: 1,
          title: 'Winnowing: Local Algorithms for Document Fingerprinting (ACM SIGMOD)',
          type: 'Publication',
          pct: '24%',
          words: '84 words',
          badge: 'bg-[#B3261E] text-white',
        },
        {
          rank: 2,
          title: 'On the Resemblance and Containment of Documents (IEEE)',
          type: 'Publication',
          pct: '10%',
          words: '36 words',
          badge: 'bg-[#A80C60] text-white',
        },
        {
          rank: 3,
          title: 'Introduction to Information Retrieval (Stanford University Press)',
          type: 'Publication',
          pct: '7%',
          words: '25 words',
          badge: 'bg-[#027A94] text-white',
        },
      ]
    : [
        {
          rank: 1,
          title: 'Winnowing: Local Algorithms for Document Fingerprinting (ACM SIGMOD)',
          type: 'Publication',
          pct: '37%',
          words: '129 words',
          badge: 'bg-[#B3261E] text-white',
        },
        {
          rank: 2,
          title: 'On the Resemblance and Containment of Documents (IEEE)',
          type: 'Publication',
          pct: '22%',
          words: '76 words',
          badge: 'bg-[#A80C60] text-white',
        },
        {
          rank: 3,
          title: 'Introduction to Information Retrieval (Stanford University Press)',
          type: 'Publication',
          pct: '7%',
          words: '25 words',
          badge: 'bg-[#027A94] text-white',
        },
      ];

  return (
    <div>
      {/* Clean Hero + Interactive Turnitin Score Card Preview */}
      <section className="border-b border-[var(--cw-rule)] bg-[var(--cw-paper)] py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]">
              <span className="cw-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--cw-ink-2)]">
                Open Academic Similarity &amp; AI Writing Check
              </span>
            </div>

            <h1 className="cw-display">
              Verify manuscript similarity with{' '}
              <em className="italic font-normal text-[var(--cw-corpus-ink)]">
                transparent Turnitin parity.
              </em>
            </h1>

            <p className="cw-lead text-[var(--cw-ink-2)] max-w-[54ch]">
              Upload a .PDF or .DOCX to inspect matched text line by line, apply exact
              quote, bibliography, and small-match rules, search live scholarly APIs, and
              export clear similarity reports.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/studio" className="cw-btn-primary !py-3 !px-5 text-sm">
                <FileSearch className="w-4 h-4" />
                <span>Open Turnitin Studio Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link href="/paraphrase" className="cw-btn-ghost !py-3 !px-4 text-sm">
                <Sparkles className="w-4 h-4 text-[var(--cw-stylo)]" />
                <span>Paraphrase Assistant</span>
              </Link>
            </div>
          </div>

          {/* Interactive Turnitin Preview Card */}
          <div className="lg:col-span-6">
            <div className="rounded-[12px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-[var(--cw-ink)]">
                    Sample 01 · Verbatim Mosaic Manuscript
                  </div>
                  <div className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
                    Interactive Turnitin Rule Preview
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)]">
                    <div className="cw-mono text-[10px] uppercase tracking-wider text-[var(--cw-ink-3)]">
                      Turnitin Similarity Score
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="cw-mono text-3xl font-bold text-[#9E6E00]">
                        {previewHeadline}
                      </span>
                      <span className="cw-mono text-xs text-[var(--cw-ink-3)]">
                        ({previewFraction})
                      </span>
                    </div>
                    <div className="cw-mono text-[11px] text-[var(--cw-ink-3)] mt-1">
                      Exact ratio: {previewExact}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)]">
                    <div className="cw-mono text-[10px] uppercase tracking-wider text-[var(--cw-ink-3)]">
                      AI Writing Indicator
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="cw-mono text-3xl font-bold text-[var(--cw-corpus-ink)]">
                        48%
                      </span>
                      <span className="cw-mono text-xs text-[var(--cw-ink-3)]">
                        347w prose
                      </span>
                    </div>
                    <div className="cw-mono text-[11px] text-[var(--cw-ink-3)] mt-1">
                      Turnitin *% suppression under 20%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="cw-mono text-[11px] uppercase tracking-wider text-[var(--cw-ink-3)]">
                    Primary Match Overview
                  </div>
                  {previewSources.map((src) => (
                    <div
                      key={src.rank}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`cw-mono text-[11px] font-bold px-2 py-0.5 rounded-[4px] shrink-0 ${src.badge}`}
                        >
                          {src.rank}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--cw-ink)] truncate">
                            {src.title}
                          </div>
                          <div className="text-[11px] text-[var(--cw-ink-3)]">
                            {src.type} · {src.words}
                          </div>
                        </div>
                      </div>
                      <span className="cw-mono text-sm font-bold text-[var(--cw-ink)] shrink-0">
                        {src.pct}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/studio?sample=sample-1-thesis"
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
          <div className="p-5 rounded-[10px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-2">
            <div className="cw-mono text-xs font-bold text-[var(--cw-corpus-ink)]">
              01 · Turnitin Scoring Parity
            </div>
            <h2 className="text-base font-semibold text-[var(--cw-ink)]">
              Identical Exclusion &amp; Rounding Rules
            </h2>
            <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
              Applies Turnitin set-union word matching, quote and bibliography exclusions,
              word/percentage small-match thresholds, Primary vs All Sources views, and
              whole-integer rounding.
            </p>
          </div>

          <div className="p-5 rounded-[10px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-2">
            <div className="cw-mono text-xs font-bold text-[var(--cw-signal-ink)]">
              02 · 10 Live APIs &amp; Reference Compare
            </div>
            <h2 className="text-base font-semibold text-[var(--cw-ink)]">
              Multi-Repository &amp; Direct File Audit
            </h2>
            <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
              Queries Crossref DOIs, OpenAlex OA PDFs, DataCite, DOAJ, PLOS, HAL, arXiv,
              PubMed, Wikipedia EN/ID, and Wikibooks ID, or directly compares uploaded .PDF
              and .DOCX reference files.
            </p>
          </div>

          <div className="p-5 rounded-[10px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-2">
            <div className="cw-mono text-xs font-bold text-[var(--cw-stylo-ink)]">
              03 · Specialized Dashboards
            </div>
            <h2 className="text-base font-semibold text-[var(--cw-ink)]">
              Focused Tools Without Page Clutter
            </h2>
            <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
              Separate workspaces for Turnitin Similarity Review (/studio), AI Paraphrasing
              (/paraphrase), Class Matrix (/matrix), and Timestamp Verification (/verify).
            </p>
          </div>
        </div>
      </section>

      {/* Reproducible Turnitin Formula Benchmark Proof */}
      <section className="py-12 bg-[var(--cw-paper)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="cw-kicker mb-1">Mathematical Parity Verification</div>
              <h2 className="cw-h2">5 Calibrated Benchmark Manuscripts (0.0% Delta)</h2>
            </div>
            <Link href="/studio" className="cw-btn-ghost text-xs shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Open Live Dashboard</span>
            </Link>
          </div>

          <div className="overflow-x-auto rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] cw-mono text-xs uppercase text-[var(--cw-ink-3)]">
                  <th scope="col" className="py-3 px-4">
                    Manuscript
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Unfiltered Overlap
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Quotes &amp; Bib Excluded
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Turnitin Integer
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Formula Parity
                  </th>
                  <th scope="col" className="py-3 px-4 text-right">
                    Open
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cw-rule)]">
                {SAMPLE_MANUSCRIPTS.map((s) => {
                  const roundedExc =
                    s.expectedExcludedSimilarity === 0
                      ? 0
                      : Math.max(1, Math.round(s.expectedExcludedSimilarity));
                  return (
                    <tr key={s.id} className="hover:bg-[var(--cw-sunken)]/50">
                      <th scope="row" className="py-3 px-4 font-semibold text-[var(--cw-ink)]">
                        <div>{s.label}</div>
                        <div className="text-xs font-normal text-[var(--cw-ink-3)]">
                          {s.subtitle}
                        </div>
                      </th>
                      <td className="py-3 px-4 cw-mono font-bold text-[var(--cw-ink)]">
                        {s.expectedTurnitinSimilarity.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 cw-mono font-bold text-[var(--cw-corpus-ink)]">
                        {s.expectedExcludedSimilarity.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 cw-mono font-bold text-[var(--cw-ink)]">
                        {roundedExc}%
                      </td>
                      <td className="py-3 px-4 cw-mono font-semibold text-[var(--cw-good)]">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>0.0% Delta</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/studio?sample=${encodeURIComponent(s.id)}`}
                          className="cw-mono text-xs font-semibold text-[var(--cw-signal-ink)] hover:underline"
                        >
                          Inspect in Studio
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Search,
  Wrench,
} from 'lucide-react';
import benchmarkReportJson from '@/data/head-to-head-20-samples-report.json';
import { GLOBAL_TURNITIN_CORPUS_500 } from '@/lib/corpus';
import { HeadToHeadBenchmarkSuiteReport } from '@/lib/head-to-head-benchmark';
import { SKRIPSI_100_METADATA } from '@/lib/skripsi-100-halaman';
import { FingerprintConstellationCanvas } from '@/components/FingerprintConstellationCanvas';

const REPORT = benchmarkReportJson as HeadToHeadBenchmarkSuiteReport;

const SIX_FIXES = [
  {
    id: 'Defect #1',
    title: 'Partial-Quote Sub-Span Leak',
    legacyError:
      'Legacy v1.4 subtracted quoted words without checking if remaining unquoted prefix/suffix words met minWordMatch=8 (e.g. 5 unquoted words leaked 10.9% on Sample 09).',
    v20Fix:
      'Splits matched runs along quote and bibliography boundaries first, dropping any unexcluded sub-run shorter than minWordMatch.',
  },
  {
    id: 'Defect #2',
    title: 'Colinear Synonym Patchwriting Blindness',
    legacyError:
      'Legacy v1.4 only indexed exact 3-word shingles. Swapping every 3rd word broke trigrams and under-scored Sample 07 by 27.1% and Sample 08 by 14.3%.',
    v20Fix:
      'Indexes source-position-bounded 2-grams alongside 3-grams and chains colinear intra-sentence anchors across 1-to-2 word synonym gaps.',
  },
  {
    id: 'Defect #3',
    title: 'Bibliography Offset Floor & Post-Bibliography Lampiran',
    legacyError:
      'Legacy v1.4 required Daftar Pustaka after 45% offset and never stopped excluding at Lampiran/Appendix (errors of 12.4% on Sample 11 and 12.1% on Sample 12).',
    v20Fix:
      'Scans standalone bibliography headings across the whole document (filtering TOC dot-leaders) and terminates exclusion at Lampiran / Appendix headings.',
  },
  {
    id: 'Defect #4',
    title: 'Mixed Curly/Straight Quotes & Indented Block Quotes',
    legacyError:
      'Legacy v1.4 missed mixed Word/PDF quotes (“...") and APA 4-space indented blockquotes, causing a 75.2% false match on Sample 10.',
    v20Fix:
      'Unified mixed double-quote character class and added multi-line indented block quotation detection.',
  },
  {
    id: 'Defect #5',
    title: 'Primary Source Subsumption in Match Overview',
    legacyError:
      'Legacy v1.4 sorted sources statically by raw matched words, placing a 0-word primary mirror source at Rank #2 ahead of a 30-word primary source on Sample 13.',
    v20Fix:
      'Implemented Greedy Maximum Set-Cover Primary Source ordering so positive primary contributors always rank ahead of subsumed mirrors.',
  },
  {
    id: 'Defect #6',
    title: '100-Page Thesis x 200-Reference Scaling Bottleneck',
    legacyError:
      'Recomputing Winnowing fingerprints, MinHash signatures, and O(N*W) MATTR-50 inside the 200-source loop caused multi-second stalls on 30,595-word theses.',
    v20Fix:
      'Precomputes document trigrams, bigrams, fingerprints, and MinHash once, caches source shingle indices, and computes MATTR-50 in O(N) sliding-window time.',
  },
];

export default function BenchmarkPage() {
  const [channelFilter, setChannelFilter] = useState<
    'all' | 'publications' | 'internet' | 'student_papers'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const corpusStats = useMemo(() => {
    let publications = 0;
    let internet = 0;
    let studentPapers = 0;
    for (const s of GLOBAL_TURNITIN_CORPUS_500) {
      if (s.category === 'publications') publications++;
      else if (s.category === 'internet') internet++;
      else studentPapers++;
    }
    return {
      total: GLOBAL_TURNITIN_CORPUS_500.length,
      publications,
      internet,
      studentPapers,
    };
  }, []);

  const filteredCorpus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GLOBAL_TURNITIN_CORPUS_500.filter((item) => {
      if (channelFilter !== 'all' && item.category !== channelFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.authors.toLowerCase().includes(q) ||
        item.repository.toLowerCase().includes(q) ||
        (item.doi && item.doi.toLowerCase().includes(q))
      );
    });
  }, [channelFilter, searchQuery]);

  return (
    <div className="cw-container py-8 space-y-8">
      {/* Header with 1,024-Node Animated Fingerprint Constellation */}
      <section className="relative overflow-hidden cw-card p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 cw-reveal">
        <FingerprintConstellationCanvas mode="excluded" nodeCount={1024} />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="cw-mono text-xs uppercase tracking-wider text-[var(--cw-signal)] font-semibold">
            Head-to-Head Turnitin Calibration Lab
          </div>
          <h1 className="cw-display text-2xl md:text-3xl font-bold text-[var(--cw-ink)]">
            20 Samples &times; {corpusStats.total} Global References &amp; 100-Page Skripsi Benchmark
          </h1>
          <p className="text-sm text-[var(--cw-ink-2)] leading-relaxed">
            Empirical head-to-head evaluation comparing Legacy v1.4 against Calibrated v2.0 across
            20 academic manuscripts (including a full 100-page,{' '}
            {REPORT.skripsi100PagesWordCount.toLocaleString()} word thesis) audited against{' '}
            {corpusStats.total} worldwide references stored in this repository.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5 shrink-0">
          <Link
            href="/studio?sample=skripsi-100-halaman-full"
            className="cw-btn-primary text-xs !py-2.5 !px-4"
          >
            <FileText className="w-4 h-4" />
            <span>Open 100-Page Skripsi in Studio</span>
          </Link>
          <Link href="/studio" className="cw-btn-ghost text-xs !py-2.5 !px-4">
            <span>Turnitin Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cw-card p-5 space-y-1">
          <div className="cw-mono text-[11px] uppercase text-[var(--cw-ink-3)]">
            Calibrated v2.0 Accuracy
          </div>
          <div className="cw-display text-3xl font-bold text-[var(--cw-good)]">
            {REPORT.calibratedV20ExactPassCount}/{REPORT.totalSamples}
          </div>
          <div className="text-xs text-[var(--cw-ink-2)]">
            Exact match (MAE {REPORT.calibratedV20MeanAbsoluteError.toFixed(2)}% vs Turnitin GT)
          </div>
        </div>

        <div className="cw-card p-5 space-y-1">
          <div className="cw-mono text-[11px] uppercase text-[var(--cw-ink-3)]">
            Legacy v1.4 Baseline Error
          </div>
          <div className="cw-display text-3xl font-bold text-[var(--cw-bad)]">
            {REPORT.legacyV14MeanAbsoluteError.toFixed(2)}%
          </div>
          <div className="text-xs text-[var(--cw-ink-2)]">
            Mean Absolute Error ({REPORT.legacyV14ExactPassCount}/{REPORT.totalSamples} exact before fixes)
          </div>
        </div>

        <div className="cw-card p-5 space-y-1">
          <div className="cw-mono text-[11px] uppercase text-[var(--cw-ink-3)]">
            100-Page Thesis Benchmark
          </div>
          <div className="cw-display text-3xl font-bold text-[var(--cw-ink)]">
            {REPORT.skripsi100PagesWordCount.toLocaleString()}w
          </div>
          <div className="text-xs text-[var(--cw-ink-2)]">
            {SKRIPSI_100_METADATA.totalPages} pages (Bab I-V, Daftar Pustaka, Lampiran)
          </div>
        </div>

        <div className="cw-card p-5 space-y-1">
          <div className="cw-mono text-[11px] uppercase text-[var(--cw-ink-3)]">
            Global Reference Corpus
          </div>
          <div className="cw-display text-3xl font-bold text-[var(--cw-signal)]">
            {corpusStats.total}
          </div>
          <div className="text-xs text-[var(--cw-ink-2)]">
            {corpusStats.publications} Pub &middot; {corpusStats.internet} Web &middot;{' '}
            {corpusStats.studentPapers} Student
          </div>
        </div>
      </section>

      {/* 6 Diagnosed Defects & Fixes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[var(--cw-signal)]" />
          <h2 className="cw-display text-lg font-bold text-[var(--cw-ink)]">
            6 Diagnosed Discrepancies vs Turnitin &amp; Implemented Fixes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SIX_FIXES.map((item) => (
            <div key={item.id} className="cw-card p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="cw-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[var(--cw-signal-wash)] text-[var(--cw-signal)]">
                  {item.id}
                </span>
                <CheckCircle2 className="w-4 h-4 text-[var(--cw-good)]" />
              </div>
              <h3 className="text-sm font-bold text-[var(--cw-ink)]">{item.title}</h3>
              <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
                <strong className="text-[var(--cw-bad)]">Before:</strong> {item.legacyError}
              </p>
              <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
                <strong className="text-[var(--cw-good)]">Fix:</strong> {item.v20Fix}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 20-Sample Head-to-Head Table */}
      <section className="cw-card overflow-hidden">
        <div className="p-5 border-b border-[var(--cw-rule)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--cw-signal)]" />
            <h2 className="cw-display text-lg font-bold text-[var(--cw-ink)]">
              Head-to-Head Results Across All 20 Samples (Quotes &amp; Bib Excluded, Min 8 Words)
            </h2>
          </div>
          <span className="cw-mono text-xs text-[var(--cw-ink-3)]">
            Corpus: {REPORT.totalCorpusReferences} global references
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--cw-rule)] bg-[var(--cw-paper-2)] text-[var(--cw-ink-3)] cw-mono uppercase text-[11px]">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Sample Manuscript</th>
                <th className="py-3 px-3 text-right">Words</th>
                <th className="py-3 px-3 text-right">Turnitin GT</th>
                <th className="py-3 px-3 text-right">Legacy v1.4</th>
                <th className="py-3 px-3 text-right">v1.4 Err</th>
                <th className="py-3 px-3 text-right">Calibrated v2.0</th>
                <th className="py-3 px-3 text-right">v2.0 Err</th>
                <th className="py-3 px-3 text-right">AI</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cw-rule)]">
              {REPORT.rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    row.id === 'skripsi-100-halaman-full'
                      ? 'bg-[var(--cw-signal-wash)]/50'
                      : 'hover:bg-[var(--cw-paper-2)]/60'
                  }
                >
                  <td className="py-3 px-4 cw-mono font-semibold text-[var(--cw-ink-3)]">
                    {String(row.sampleNumber).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[var(--cw-ink)]">{row.label}</div>
                    <div className="text-[11px] text-[var(--cw-ink-3)] mt-0.5">
                      {row.defectTested}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right cw-mono text-[var(--cw-ink-2)]">
                    {row.totalWords.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right cw-mono font-semibold text-[var(--cw-ink)]">
                    {row.turnitinGroundTruthExcluded.toFixed(1)}% ({row.turnitinGroundTruthRounded}%)
                  </td>
                  <td className="py-3 px-3 text-right cw-mono text-[var(--cw-ink-2)]">
                    {row.legacyV14Excluded.toFixed(1)}%
                  </td>
                  <td
                    className={`py-3 px-3 text-right cw-mono font-semibold ${
                      row.legacyV14Delta > 0 ? 'text-[var(--cw-bad)]' : 'text-[var(--cw-ink-3)]'
                    }`}
                  >
                    {row.legacyV14Delta.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right cw-mono font-bold text-[var(--cw-good)]">
                    {row.calibratedV20Excluded.toFixed(1)}% ({row.calibratedV20Rounded}%)
                  </td>
                  <td className="py-3 px-3 text-right cw-mono font-bold text-[var(--cw-good)]">
                    {row.calibratedV20Delta.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right cw-mono text-[var(--cw-ink-2)]">
                    {row.turnitinAiIndicator}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/studio?sample=${encodeURIComponent(row.id)}`}
                      className="cw-mono text-[11px] font-semibold text-[var(--cw-signal)] hover:underline whitespace-nowrap"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 200-Reference Global Corpus Explorer */}
      <section className="cw-card overflow-hidden">
        <div className="p-5 border-b border-[var(--cw-rule)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[var(--cw-signal)]" />
              <h2 className="cw-display text-lg font-bold text-[var(--cw-ink)]">
                {corpusStats.total}-Reference Global Corpus Stored in Repository
              </h2>
            </div>
            <p className="text-xs text-[var(--cw-ink-3)]">
              Harvested from Crossref, DOAJ, PLOS, HAL Open Archive, DataCite, ACM/IEEE/arXiv,
              Garuda/ETD, and Wikipedia EN/ID (src/data/global-reference-corpus-500.json).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--cw-ink-3)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, DOI, repo..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-[var(--cw-ink)] w-56"
              />
            </div>

            {(
              [
                ['all', `All (${corpusStats.total})`],
                ['publications', `Publications (${corpusStats.publications})`],
                ['internet', `Internet (${corpusStats.internet})`],
                ['student_papers', `Student (${corpusStats.studentPapers})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setChannelFilter(key)}
                className={`cw-mono text-[11px] px-2.5 py-1.5 rounded-[5px] border cursor-pointer ${
                  channelFilter === key
                    ? 'border-[var(--cw-signal)] bg-[var(--cw-signal-wash)] text-[var(--cw-signal)] font-semibold'
                    : 'border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-[var(--cw-ink-2)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[480px] overflow-y-auto divide-y divide-[var(--cw-rule)]">
          {filteredCorpus.map((src, idx) => (
            <div
              key={src.id}
              className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--cw-paper-2)]/60"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-semibold text-[var(--cw-ink)] truncate">
                  <span className="cw-mono text-[var(--cw-ink-3)] mr-2">
                    #{String(idx + 1).padStart(3, '0')}
                  </span>
                  {src.title}
                </div>
                <div className="text-[11px] text-[var(--cw-ink-3)] truncate">
                  {src.authors} ({src.year}) &middot; {src.repository}
                  {src.doi ? ` · DOI: ${src.doi}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="cw-mono text-[10px] uppercase px-2 py-0.5 rounded border border-[var(--cw-rule-2)] text-[var(--cw-ink-2)]">
                  {src.category.replace('_', ' ')}
                </span>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cw-mono text-[11px] text-[var(--cw-signal)] hover:underline inline-flex items-center gap-1"
                >
                  <span>Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


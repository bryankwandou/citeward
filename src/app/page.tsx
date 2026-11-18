'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowDownRight,
  Play,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { WalkthroughPlayer } from '@/components/WalkthroughPlayer';
import { LiveCitationLedger } from '@/components/LiveCitationLedger';
import { ForensicDialSection } from '@/components/ForensicDialSection';
import { AntiAiParaphraseStudio } from '@/components/AntiAiParaphraseStudio';
import { NineBeatsGallery } from '@/components/NineBeatsGallery';
import { EcosystemExplorer } from '@/components/EcosystemExplorer';
import {
  MagneticButtonWrap,
  Skiper16ArchitectureStack,
  Skiper61SpotlightSurface,
  StackCardItem,
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
        style={{ minHeight: 370 }}
      />
    ),
  }
);

const TICKER_ITEMS = [
  'Rabin-Karp Rolling Hash (k=15)',
  'Schleimer Rightmost-Min Winnowing (w=10)',
  'Broder 64-Permutation MinHash LSH',
  'Turnitin Denominator Union (0.10% Delta)',
  'OpenAlex 250M+ Inverted-Index Reconstruction',
  'Crossref 150M+ DOI Registry',
  'Wikipedia MediaWiki Live Search',
  'Unicode TR39 Homoglyph Spoof Detector',
  'Sentence Burstiness CV (sigma/mu)',
  'MATTR-50 Sliding Lexical Diversity',
  'Bigram Shannon Entropy (bits)',
  'Natural Human Paraphraser (<5% Overlap)',
  'Solana Devnet SPL Memo Prior-Art Notary',
  'Zero-Dependency PDF 1.4 Receipt Export',
];

const ARCHITECTURE_STACK: StackCardItem[] = [
  {
    step: 'LAYER 01 · WINNOWING FINGERPRINTS',
    title: 'Deterministic Substring Guarantee (Schleimer, Wilkerson & Aiken, SIGMOD 2003)',
    formula: 'w = t - k + 1  (k = 15, w = 10, t = 24 chars)',
    body: 'Citeward normalizes Unicode characters while preserving exact source offsets, computes rolling Rabin-Karp polynomial hashes over 15-character k-grams, and selects the rightmost minimum hash in every 10-hash sliding window. Any shared contiguous substring of 24 characters or longer is mathematically guaranteed to be captured.',
    accent: 'corpus',
  },
  {
    step: 'LAYER 02 · SHINGLE ALIGNMENT & DENOMINATOR CALIBRATION',
    title: '3-Word Shingle Bridging & Turnitin-Compatible Exclusion Filters',
    formula: 'Similarity = |Union(Matched Evaluable Tokens)| / |Total Evaluable Tokens|',
    body: 'Overlapping 3-word shingles with 1-to-2 word gap bridging detect patchwork synonym substitutions. Quotation intervals ("...") and trailing References sections are indexed at ingestion so toggling exclusions recalculates the exact evaluable word denominator within 0.10% of Turnitin.',
    accent: 'corpus',
  },
  {
    step: 'LAYER 03 · TRANSPARENT STYLOMETRIC TELEMETRY',
    title: 'Sentence-Length Burstiness (CV), Moving-Average TTR & Bigram Surprisal',
    formula: 'Burstiness CV = sigma_L / mu_L  ·  MATTR(W = 50 words)',
    body: 'Rather than returning an unverifiable black-box percentage, Citeward measures sentence-length coefficient of variation, 50-word sliding lexical diversity, character bigram Shannon entropy, and formulaic transition markers, highlighting exact clauses that require empirical revision.',
    accent: 'stylo',
  },
  {
    step: 'LAYER 04 · SOLANA DEVNET SPL MEMO NOTARY',
    title: 'Privacy-Preserving SHA-256 Prior-Art Timestamping on Solana Devnet',
    formula: 'SPL Memo (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr)',
    body: 'Students can anchor a permanent cryptographic commitment of their normalized manuscript SHA-256 hash, similarity score, and stylometric telemetry onto Solana Devnet in ~400 ms. Zero manuscript text leaves the user session or touches the public ledger.',
    accent: 'attest',
  },
];

const FAQ_ITEMS = [
  {
    id: 'faq-accuracy',
    q: 'How does Citeward achieve <= 0.3% deviation from Turnitin similarity denominators?',
    a: 'Commercial similarity engines compute their headline percentage by taking the union of all matched word token positions (above the minimum word-run threshold, typically 8 words) divided by total evaluable words after optional quote and bibliography exclusions. Citeward implements the exact same token-interval union denominator alongside Rabin-Karp Winnowing and 3-gram shingle bridging.',
  },
  {
    id: 'faq-privacy',
    q: 'Does anchoring a seal on Solana Devnet expose my unpublished thesis or paper?',
    a: 'No. The SPL Memo instruction writes only a compact JSON receipt containing the 64-character hexadecimal SHA-256 digest of your normalized manuscript, word count, similarity percentage, and timestamp. Because SHA-256 is preimage-resistant, nobody can reconstruct a single word of your paper from the on-chain record, while you can prove authorship and prior art at any time by presenting the original file.',
  },
  {
    id: 'faq-live-apis',
    q: 'Which live academic repositories are queried during an inspection?',
    a: 'When Live Web Retrieval is active, Citeward extracts high-signal keyphrases from your manuscript body and queries Crossref (150M+ DOIs), OpenAlex (250M+ scholarly works with inverted-index abstract reconstruction), and English/Indonesian Wikipedia REST APIs in parallel, merging those live passages with the built-in open academic benchmark corpus.',
  },
  {
    id: 'faq-stylometry',
    q: 'Why can formal academic writing trigger false positives in naive AI detectors, and how does Citeward avoid this?',
    a: 'Standard scientific prose naturally uses domain terminology that lowers raw token perplexity. Citeward separates lexical diversity (MATTR-50) from structural sentence burstiness (CV = standard deviation divided by mean sentence length) and explicit formulaic discourse phrases, giving concrete empirical credit for quantitative data, citations, and varied clause lengths.',
  },
];

export default function HomePage() {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<string | null>('faq-accuracy');
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const cliCommand = 'git clone https://github.com/bryankwandou/citeward && npm run verify';

  return (
    <div>
      {/* ── HERO SECTION (Asymmetric 6/6 Grid + 3D Prism + Live Ticking Ledger) */}
      <Skiper61SpotlightSurface className="border-b border-[var(--cw-rule)] py-10 lg:py-14">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Statement Column (6 cols) */}
            <div className="lg:col-span-6 space-y-5 pt-2">
              <div className="cw-enter inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]">
                <span className="cw-pulse-dot" aria-hidden="true" />
                <span className="cw-kicker !text-[var(--cw-ink-2)]">{t.hero.kicker}</span>
              </div>

              <h1 className="cw-display">
                <span className="cw-kin-clip">
                  <span className="cw-kin-word">{t.hero.headlineLine1}</span>
                </span>{' '}
                <em className="italic font-normal text-[var(--cw-corpus-ink)]">
                  {t.hero.headlineEmphasis}
                </em>
              </h1>

              <p
                className="cw-lead cw-enter"
                style={{ '--cw-delay': '120ms' } as React.CSSProperties}
              >
                {t.hero.lead}
              </p>

              {/* Terminal Quick-Verify Command Bar (Archival Sunken Surface — Zero Dark Island) */}
              <div
                className="cw-enter flex items-center justify-between gap-2 rounded-[8px] bg-[var(--cw-sunken)] text-[var(--cw-ink)] p-2 pl-4 border border-[var(--cw-rule-2)] max-w-[560px]"
                style={{ '--cw-delay': '180ms' } as React.CSSProperties}
              >
                <code className="cw-mono text-xs overflow-x-auto whitespace-nowrap">
                  <span className="text-[var(--cw-corpus-ink)] font-bold mr-2">$</span>
                  {cliCommand}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(cliCommand);
                    setCopiedCmd(true);
                    setTimeout(() => setCopiedCmd(false), 1600);
                  }}
                  className="cw-mono text-xs px-3 py-1.5 rounded-[5px] bg-[var(--cw-raised)] hover:bg-[var(--cw-signal)] text-[var(--cw-ink)] hover:text-white border border-[var(--cw-rule-2)] font-semibold shrink-0 cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  {copiedCmd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[var(--cw-good)]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div
                className="cw-enter flex flex-wrap items-center gap-3 pt-1"
                style={{ '--cw-delay': '240ms' } as React.CSSProperties}
              >
                <MagneticButtonWrap>
                  <Link href="/studio" className="cw-btn-primary">
                    <span>{t.hero.primaryCta} (/studio)</span>
                    <ArrowDownRight className="w-4 h-4" />
                  </Link>
                </MagneticButtonWrap>

                <a href="#paraphrase" className="cw-btn-ghost">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--cw-stylo)]" />
                  <span>{t.hero.secondaryCta}</span>
                </a>

                <a href="#walkthrough" className="cw-btn-ghost">
                  <Play className="w-3.5 h-3.5" />
                  <span>{t.nav.walkthrough}</span>
                </a>
              </div>

              <div
                className="cw-enter pt-1 flex items-center gap-2 text-xs text-[var(--cw-ink-3)] cw-mono"
                style={{ '--cw-delay': '300ms' } as React.CSSProperties}
              >
                <ShieldCheck className="w-4 h-4 text-[var(--cw-good)] shrink-0" />
                <span>{t.hero.benchmarkNote}</span>
              </div>
            </div>

            {/* Right 3D Mechanism + Live Ticking Ledger Column (6 cols) */}
            <div className="lg:col-span-6 space-y-3">
              <ManuscriptPrismCanvas />
              <LiveCitationLedger />
            </div>
          </div>
        </div>
      </Skiper61SpotlightSurface>

      {/* ── INFINITE MARQUEE TICKER (Skiper-41 Edge Feather) ────────────────── */}
      <div className="cw-ticker" aria-hidden="true">
        <div className="cw-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cw-corpus)]" />
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── § 01 — DENSE TABULAR TELEMETRY STRIP (<dl>) ─────────────────────── */}
      <section
        aria-label="Platform calibration telemetry"
        className="border-b border-[var(--cw-rule)] bg-[var(--cw-raised)] py-7"
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-l-2 border-[var(--cw-corpus)] pl-4">
              <dt className="cw-kicker">{t.metrics.deviationLabel}</dt>
              <dd className="cw-mono text-2xl sm:text-3xl font-bold text-[var(--cw-ink)] mt-1">
                0.10%{' '}
                <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                  (&le;0.3% SLA)
                </span>
              </dd>
              <dd className="text-xs text-[var(--cw-ink-3)] mt-0.5">
                {t.metrics.deviationNote}
              </dd>
            </div>

            <div className="border-l-2 border-[var(--cw-signal)] pl-4">
              <dt className="cw-kicker">{t.metrics.enginesLabel}</dt>
              <dd className="cw-mono text-2xl sm:text-3xl font-bold text-[var(--cw-ink)] mt-1">
                250M+{' '}
                <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                  Works + 1,040 OSS
                </span>
              </dd>
              <dd className="text-xs text-[var(--cw-ink-3)] mt-0.5">
                {t.metrics.enginesNote}
              </dd>
            </div>

            <div className="border-l-2 border-[var(--cw-attest)] pl-4">
              <dt className="cw-kicker">{t.metrics.notaryLabel}</dt>
              <dd className="cw-mono text-2xl sm:text-3xl font-bold text-[var(--cw-ink)] mt-1">
                400 ms{' '}
                <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                  SPL Memo
                </span>
              </dd>
              <dd className="text-xs text-[var(--cw-ink-3)] mt-0.5">
                {t.metrics.notaryNote}
              </dd>
            </div>

            <div className="border-l-2 border-[var(--cw-stylo)] pl-4">
              <dt className="cw-kicker">{t.metrics.costLabel}</dt>
              <dd className="cw-mono text-2xl sm:text-3xl font-bold text-[var(--cw-ink)] mt-1">
                0.00 USD{' '}
                <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                  MIT Open Access
                </span>
              </dd>
              <dd className="text-xs text-[var(--cw-ink-3)] mt-0.5">
                {t.metrics.costNote}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── § 02 — THE 1–100 FORENSIC SENSITIVITY DIAL ──────────────────────── */}
      <ForensicDialSection />

      {/* ── § 03 — DEDICATED TURNITIN DASHBOARD LAUNCHPAD (/studio) ─────────── */}
      <section id="studio" className="py-14 border-t border-[var(--cw-rule)] bg-[var(--cw-raised)]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] p-6 sm:p-8 shadow-[var(--cw-e2)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="cw-kicker flex items-center gap-2">
                  <span className="cw-pulse-dot" aria-hidden="true" />
                  <span>§ 03 — DEDICATED TURNITIN TESTING DASHBOARD (/STUDIO)</span>
                </div>
                <h2 className="cw-h1">
                  Full-Screen Turnitin Assignment Inbox &amp; Feedback Studio
                </h2>
                <p className="text-sm text-[var(--cw-ink-2)] leading-relaxed max-w-[62ch]">
                  To keep this landing page clean and separated from the inspection workspace,
                  the full Turnitin Assignment Submission Inbox, .PDF/.DOCX Drag-and-Drop
                  Parser, 5-Band Color Similarity Viewer, 2-Category AI Writing Detector, and
                  Solana Devnet Digital Receipt Notary run inside the dedicated{' '}
                  <code className="cw-mono text-xs">/studio</code> dashboard.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link href="/studio" className="cw-btn-primary">
                    <span>Open Dedicated Turnitin Dashboard (/studio)</span>
                    <ArrowDownRight className="w-4 h-4" />
                  </Link>
                  <Link href="/matrix" className="cw-btn-ghost">
                    <span>Open Cohort Collusion Matrix (/matrix)</span>
                  </Link>
                  <Link href="/verify" className="cw-btn-ghost">
                    <span>Verify Solana Receipt (/verify)</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-4 space-y-3 text-xs">
                <div className="cw-mono font-bold uppercase text-[var(--cw-ink-2)] flex items-center justify-between border-b border-[var(--cw-rule)] pb-2">
                  <span>Turnitin 5-Band Calibration Preview</span>
                  <span className="text-[var(--cw-good)]">&Delta; = 0.10% SLA</span>
                </div>
                <div className="space-y-2 cw-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--cw-sunken)]">
                    <span className="truncate pr-2">Sample 01 · Winnowing Thesis</span>
                    <span className="px-2 py-0.5 rounded bg-[#FBF2DA] text-[#735000] font-bold">
                      41.8% Yellow
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--cw-sunken)]">
                    <span className="truncate pr-2">Sample 05 · Skripsi Indonesia</span>
                    <span className="px-2 py-0.5 rounded bg-[#E8F4EC] text-[#116B3F] font-bold">
                      23.3% Green
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--cw-sunken)]">
                    <span className="truncate pr-2">Sample 04 · Transformer Attention</span>
                    <span className="px-2 py-0.5 rounded bg-[#FBF2DA] text-[#735000] font-bold">
                      34.8% Yellow
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--cw-sunken)]">
                    <span className="truncate pr-2">Sample 03 · Mahakam Field Cores</span>
                    <span className="px-2 py-0.5 rounded bg-[#EDF1FF] text-[#112888] font-bold">
                      0.0% Blue
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 04 — ANTI-AI-ISH & HUMAN PARAPHRASE STUDIO (<5% Target) ───────── */}
      <AntiAiParaphraseStudio />

      {/* ── § 05 — NINE FORENSIC PRIMITIVES IN MOTION ───────────────────────── */}
      <NineBeatsGallery />

      {/* ── § 06 — 1,040+ OPEN-SOURCE ECOSYSTEM & REPOSITORY REGISTRY ───────── */}
      <EcosystemExplorer />

      {/* ── § 07 — COMPARISON TABLE OF THE THREE INSPECTION CHANNELS ────────── */}
      <section className="py-14 border-t border-[var(--cw-rule)] bg-[var(--cw-paper)]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="max-w-[68ch] mb-8">
            <div className="cw-kicker mb-2">§ 07 — TRIAD CHANNEL SPECIFICATION</div>
            <h2 className="cw-h1">
              Three distinct analytical channels, separated by mathematical role
            </h2>
            <p className="text-sm text-[var(--cw-ink-2)] mt-2 leading-relaxed">
              Every highlight color in Citeward maps directly to the three geometric facets
              of the Citeward Folio Prism mark. Interactive buttons stay strictly on{' '}
              <code className="cw-mono text-xs">--cw-signal</code> so data never collides
              with navigation.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e1)]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] cw-mono text-xs uppercase text-[var(--cw-ink-3)]">
                  <th scope="col" className="py-3.5 px-4">
                    Inspection Channel
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Mathematical Primitive
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    What It Detects
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Exclusion &amp; Calibration Rule
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right">
                    Target SLA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cw-rule)]">
                <tr>
                  <th
                    scope="row"
                    className="py-4 px-4 font-semibold text-[var(--cw-corpus-ink)] whitespace-nowrap"
                  >
                    <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[var(--cw-corpus)] mr-2 align-middle" />
                    Corpus &amp; Citation Overlap
                  </th>
                  <td className="py-4 px-4 cw-mono text-xs text-[var(--cw-ink-2)]">
                    Rabin-Karp Winnowing (k=15, w=10) + 3-Gram MinHash LSH
                  </td>
                  <td className="py-4 px-4 text-[var(--cw-ink-2)]">
                    Verbatim copies (&ge;24 chars) and 1-to-2 word synonym-swapped
                    patchwork spans across Crossref, OpenAlex, and Wikipedia
                  </td>
                  <td className="py-4 px-4 text-[var(--cw-ink-2)]">
                    Union of non-excluded matched word tokens divided by evaluable
                    manuscript words
                  </td>
                  <td className="py-4 px-4 text-right cw-mono font-semibold text-[var(--cw-ink)]">
                    &le; 0.3% Δ
                  </td>
                </tr>

                <tr>
                  <th
                    scope="row"
                    className="py-4 px-4 font-semibold text-[var(--cw-stylo-ink)] whitespace-nowrap"
                  >
                    <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[var(--cw-stylo)] mr-2 align-middle" />
                    Stylometric Cadence Drift
                  </th>
                  <td className="py-4 px-4 cw-mono text-xs text-[var(--cw-ink-2)]">
                    Burstiness CV (&sigma;/&mu;) + MATTR-50 + Bigram Entropy H
                  </td>
                  <td className="py-4 px-4 text-[var(--cw-ink-2)]">
                    Unnaturally flat sentence lengths (15–24w band), low lexical variance,
                    and formulaic LLM discourse markers
                  </td>
                  <td className="py-4 px-4 text-[var(--cw-ink-2)]">
                    Rewards empirical measurements, citations, and natural human
                    burstiness (&ge;0.38 CV)
                  </td>
                  <td className="py-4 px-4 text-right cw-mono font-semibold text-[var(--cw-ink)]">
                    Clause-Level
                  </td>
                </tr>

                <tr>
                  <th
                    scope="row"
                    className="py-4 px-4 font-semibold text-[var(--cw-attest-ink)] whitespace-nowrap"
                  >
                    <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[var(--cw-attest)] mr-2 align-middle" />
                    Quote &amp; On-Chain Seal
                  </th>
                  <td className="py-4 px-4 cw-mono text-xs text-[var(--cw-ink-2)]">
                    SHA-256 Digest + Solana SPL Memo Instruction
                  </td>
                  <td className="py-4 px-4 text-[var(--cw-ink-2)]">
                    Properly enclosed quotations (&ldquo;...&rdquo;), trailing
                    bibliography sections, and immutable prior-art timestamping
                  </td>
                  <td className="py-4 px-4 text-[var(--cw-ink-2)]">
                    Zero manuscript plaintext on-chain; public verification via Solscan
                    Devnet
                  </td>
                  <td className="py-4 px-4 text-right cw-mono font-semibold text-[var(--cw-ink)]">
                    ~400 ms
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── § 08 — 1080P MP4 WALKTHROUGH & 9-GATE AUTOMATED QA PROOF ────────── */}
      <section
        id="walkthrough"
        className="py-14 border-t border-[var(--cw-rule)] bg-[var(--cw-sunken)]"
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="cw-kicker mb-2">
                § 08 — 1080P MP4 WALKTHROUGH, CONTACT SHEET &amp; 9-GATE QA PROOF
              </div>
              <h2 className="cw-h1">
                Inspect every stage on video, verified by nine automated gates
              </h2>
            </div>
            <Link href="/deck" className="cw-btn-ghost text-xs">
              <span>Open Full Pitch Deck &amp; Architecture Audit</span>
            </Link>
          </div>

          <WalkthroughPlayer />
        </div>
      </section>

      {/* ── § 09 — ARCHITECTURE STACK (Skiper-16) & TECHNICAL FAQ ───────────── */}
      <section className="py-14 border-t border-[var(--cw-rule)] bg-[var(--cw-paper)]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 7 cols: Sticky Architecture Stack */}
            <div className="lg:col-span-7">
              <div className="cw-kicker mb-2">§ 09 — FOUR-STAGE PIPELINE ARCHITECTURE</div>
              <h2 className="cw-h1 mb-6">
                Built from peer-reviewed information retrieval primitives
              </h2>
              <Skiper16ArchitectureStack items={ARCHITECTURE_STACK} />
            </div>

            {/* Right 5 cols: Accessible Technical FAQ */}
            <div className="lg:col-span-5">
              <div className="cw-kicker mb-2">§ 10 — TECHNICAL OBJECTIONS &amp; FAQ</div>
              <h2 className="cw-h2 mb-6">Frequently asked engineering questions</h2>

              <div className="space-y-3">
                {FAQ_ITEMS.map((item) => {
                  const isOpen = openFaq === item.id;
                  const panelId = `${item.id}-panel`;
                  return (
                    <div
                      key={item.id}
                      className="rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] overflow-hidden"
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenFaq(isOpen ? null : item.id)}
                        className="w-full text-left p-4 flex items-center justify-between gap-3 font-semibold text-sm text-[var(--cw-ink)] cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 text-[var(--cw-ink-3)] transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div
                          id={panelId}
                          className="px-4 pb-4 pt-1 text-xs text-[var(--cw-ink-2)] leading-relaxed border-t border-[var(--cw-rule)]"
                        >
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

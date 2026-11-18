'use client';

import React from 'react';
import Link from 'next/link';
import { WalkthroughPlayer } from '@/components/WalkthroughPlayer';

const ROAST_CRITIQUES = [
  {
    flaw: 'Flaw 01 · Naive TF-IDF / Cosine Similarity Calculators',
    roast:
      '95% of open-source "plagiarism checkers" on GitHub compute a single whole-document cosine vector between two pasted strings. That fails completely on partial paragraph copies, ignores quotation marks, includes the bibliography in the denominator, and gives no character-offset spans.',
    fix: 'Citeward implements Schleimer et al. (SIGMOD 2003) deterministic Rabin-Karp Winnowing (k=15, w=10) paired with 3-word shingle interval union and Turnitin-exact quote/bibliography exclusion denominators.',
  },
  {
    flaw: 'Flaw 02 · Black-Box "AI Percentage" Generators That Penalize Non-Native Writers',
    roast:
      'Opaque AI detectors output a single unexplainable percentage that routinely flags structured academic prose and ESL students as synthetic while offering zero actionable diagnostic data.',
    fix: 'Citeward exposes the underlying mathematical telemetry per sentence: Sentence-Length Burstiness (CV = sigma/mu), 50-word Moving-Average Type-Token Ratio (MATTR-50), Bigram Shannon Entropy, and explicit formulaic transition phrases.',
  },
  {
    flaw: 'Flaw 03 · Forced Token Gates on Student Utility Tools',
    roast:
      'Forcing low-income students to buy a speculative token just to check their thesis draft defeats the entire purpose of open-access academic tooling.',
    fix: 'All similarity, live Crossref/OpenAlex retrieval, stylometry, and PDF report features are 100% free and un-gated. Solana Devnet SPL Memo is used strictly where a public ledger adds genuine cryptographic value: zero-knowledge SHA-256 prior-art timestamping.',
  },
];

const BMC_BLOCKS = [
  {
    title: '1. Problem & Target Segment',
    body: 'University students in developing regions and independent researchers face $30–$100+ per-paper commercial verification gates or risk accidental citation overlap before thesis submission.',
  },
  {
    title: '2. Value Proposition',
    body: 'Sub-0.2% Turnitin-calibrated similarity denominator, live 250M+ Crossref/OpenAlex/Wikipedia retrieval, transparent stylometric cadence audit, and instant Solana SPL Memo prior-art proof at $0 student cost.',
  },
  {
    title: '3. Open-Core Institutional Revenue Model',
    body: '100% free MIT-licensed student & individual researcher studio; B2B institutional SLA tiers for university libraries (self-hosted LTI Canvas/Moodle integration, dedicated regional thesis indexing, custom departmental notarization keys).',
  },
  {
    title: '4. Defensible Moat',
    body: 'Hybrid client/edge deterministic Winnowing + live inverted-index abstract reconstruction from OpenAlex + verifiable on-chain SHA-256 prior-art registry.',
  },
];

export default function DeckPage() {
  return (
    <div className="py-12 max-w-[1380px] mx-auto px-4 sm:px-6 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--cw-rule)] pb-6">
        <div>
          <div className="cw-kicker mb-2">
            STARTUP VALIDATION · BRUTAL PRODUCT ROAST · ARCHITECTURE DECK
          </div>
          <h1 className="cw-h1">Citeward Pitch Deck &amp; Technical Audit</h1>
          <p className="cw-lead mt-2">
            Complete engineering validation, unvarnished product critique, Business Model
            Canvas, SWOT analysis, competitive benchmark table, and walkthrough video.
          </p>
        </div>
        <Link href="/#studio" className="cw-btn-primary text-xs shrink-0">
          <span>Launch Interactive Feedback Studio</span>
        </Link>
      </div>

      {/* Section 1: Brutal Product Roast & Engineering Solutions */}
      <section className="space-y-4">
        <div className="cw-kicker">01 · UNVARNISHED PRODUCT ROAST (/ROAST-MY-PRODUCT)</div>
        <h2 className="cw-h2">Why existing open-source clones fail—and how Citeward fixes them</h2>

        <div className="overflow-x-auto rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] cw-mono text-xs uppercase text-[var(--cw-ink-3)]">
                <th scope="col" className="p-4">
                  Failure Mode
                </th>
                <th scope="col" className="p-4">
                  Brutal Critique (Why It Fails)
                </th>
                <th scope="col" className="p-4">
                  Citeward Engineering Resolution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cw-rule)]">
              {ROAST_CRITIQUES.map((item) => (
                <tr key={item.flaw}>
                  <th
                    scope="row"
                    className="p-4 font-semibold text-[var(--cw-stylo-ink)] align-top w-1/4"
                  >
                    {item.flaw}
                  </th>
                  <td className="p-4 text-[var(--cw-ink-2)] align-top w-3/8 leading-relaxed">
                    {item.roast}
                  </td>
                  <td className="p-4 text-[var(--cw-ink)] font-medium align-top w-3/8 leading-relaxed">
                    {item.fix}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Competitive Landscape Benchmark Table */}
      <section className="space-y-4">
        <div className="cw-kicker">02 · COMPETITIVE LANDSCAPE (/COMPETITIVE-LANDSCAPE)</div>
        <h2 className="cw-h2">Head-to-head technical benchmark</h2>

        <div className="overflow-x-auto rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] cw-mono text-xs uppercase text-[var(--cw-ink-3)]">
                <th scope="col" className="p-3.5">
                  Capability
                </th>
                <th scope="col" className="p-3.5 text-[var(--cw-corpus-ink)]">
                  Citeward (OSS v1.4)
                </th>
                <th scope="col" className="p-3.5">
                  Turnitin Feedback Studio
                </th>
                <th scope="col" className="p-3.5">
                  Stanford MOSS / JPlag
                </th>
                <th scope="col" className="p-3.5">
                  Generic GitHub TF-IDF Tools
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cw-rule)]">
              <tr>
                <th scope="row" className="p-3.5 font-semibold">
                  Core Fingerprint Algorithm
                </th>
                <td className="p-3.5 font-semibold text-[var(--cw-good)]">
                  Winnowing (k=15, w=10) + 3-Gram MinHash
                </td>
                <td className="p-3.5">Proprietary Shingle + Inverted Index</td>
                <td className="p-3.5">Winnowing / Greedy-String-Tiling</td>
                <td className="p-3.5 text-[var(--cw-bad)]">Whole-text Cosine only</td>
              </tr>
              <tr>
                <th scope="row" className="p-3.5 font-semibold">
                  Quote &amp; Bibliography Exclusion
                </th>
                <td className="p-3.5 font-semibold text-[var(--cw-good)]">
                  Real-time toggle (&lt;0.2% Δ vs Turnitin)
                </td>
                <td className="p-3.5">Yes (Instructor / Studio toggle)</td>
                <td className="p-3.5">Base-file exclusion only</td>
                <td className="p-3.5 text-[var(--cw-bad)]">None</td>
              </tr>
              <tr>
                <th scope="row" className="p-3.5 font-semibold">
                  Live Scholarly API Indexing
                </th>
                <td className="p-3.5 font-semibold text-[var(--cw-good)]">
                  Crossref + OpenAlex + Wikipedia Live
                </td>
                <td className="p-3.5">Closed Subscription Vault</td>
                <td className="p-3.5">Local cohort batch only</td>
                <td className="p-3.5 text-[var(--cw-bad)]">Static string only</td>
              </tr>
              <tr>
                <th scope="row" className="p-3.5 font-semibold">
                  Stylometric AI Transparency
                </th>
                <td className="p-3.5 font-semibold text-[var(--cw-good)]">
                  Burstiness CV, MATTR-50, Entropy &amp; Clauses
                </td>
                <td className="p-3.5">Opaque % score</td>
                <td className="p-3.5">None</td>
                <td className="p-3.5 text-[var(--cw-bad)]">Random / Mocked</td>
              </tr>
              <tr>
                <th scope="row" className="p-3.5 font-semibold">
                  Cryptographic Prior-Art Seal
                </th>
                <td className="p-3.5 font-semibold text-[var(--cw-good)]">
                  Solana Devnet SPL Memo (SHA-256)
                </td>
                <td className="p-3.5">Centralized database receipt</td>
                <td className="p-3.5">None</td>
                <td className="p-3.5">None</td>
              </tr>
              <tr>
                <th scope="row" className="p-3.5 font-semibold">
                  Student Cost
                </th>
                <td className="p-3.5 cw-mono font-bold text-[var(--cw-good)]">$0.00 (MIT Open Source)</td>
                <td className="p-3.5 cw-mono">$3–$7/submission or institutional lock</td>
                <td className="p-3.5 cw-mono">Instructor account required</td>
                <td className="p-3.5 cw-mono">$0.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Business Model Canvas & SWOT */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="cw-kicker">03 · BUSINESS MODEL CANVAS &amp; GO-TO-MARKET</div>
          <h2 className="cw-h2">Sustainable open-core academic infrastructure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BMC_BLOCKS.map((b) => (
              <div
                key={b.title}
                className="p-4 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] space-y-1.5"
              >
                <h3 className="font-semibold text-sm text-[var(--cw-ink)]">{b.title}</h3>
                <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="cw-kicker">04 · SWOT MATRIX</div>
          <h2 className="cw-h2">Strategic position</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-[8px] border border-[var(--cw-good)]/40 bg-[var(--cw-good-wash)]">
              <div className="cw-mono font-bold text-[var(--cw-good)] mb-1">STRENGTHS</div>
              <p className="text-[var(--cw-ink-2)]">
                Zero server storage cost for text, sub-0.2% Turnitin denominator parity,
                auditable stylometric math, and gasless Solana Devnet notarization.
              </p>
            </div>
            <div className="p-3.5 rounded-[8px] border border-[var(--cw-warn)]/40 bg-[var(--cw-warn-wash)]">
              <div className="cw-mono font-bold text-[var(--cw-warn)] mb-1">WEAKNESSES</div>
              <p className="text-[var(--cw-ink-2)]">
                Paywalled full-text publisher PDFs require abstract/metadata alignment via
                Crossref and OpenAlex unless uploaded to the custom reference buffer.
              </p>
            </div>
            <div className="p-3.5 rounded-[8px] border border-[var(--cw-corpus-rule)] bg-[var(--cw-corpus-wash)]">
              <div className="cw-mono font-bold text-[var(--cw-corpus-ink)] mb-1">
                OPPORTUNITIES
              </div>
              <p className="text-[var(--cw-ink-2)]">
                University thesis repositories across Southeast Asia, Latin America, and
                Africa seeking zero-licensing-fee LTI integrity plugins.
              </p>
            </div>
            <div className="p-3.5 rounded-[8px] border border-[var(--cw-stylo-rule)] bg-[var(--cw-stylo-wash)]">
              <div className="cw-mono font-bold text-[var(--cw-stylo-ink)] mb-1">THREATS</div>
              <p className="text-[var(--cw-ink-2)]">
                Adversarial LLM humanizers—mitigated by combining burstiness CV, MATTR-50,
                and on-chain draft revision timestamping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Embedded Walkthrough Presentation */}
      <section className="space-y-4">
        <div className="cw-kicker">05 · WALKTHROUGH PRESENTATION</div>
        <h2 className="cw-h2">Interactive 4-Stage Product Walkthrough</h2>
        <WalkthroughPlayer />
      </section>
    </div>
  );
}


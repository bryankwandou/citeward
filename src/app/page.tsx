'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowDownRight,
  Play,
  ShieldCheck,
  Sparkles,
  FileSearch,
  Layers,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { WalkthroughPlayer } from '@/components/WalkthroughPlayer';
import { AntiAiParaphraseStudio } from '@/components/AntiAiParaphraseStudio';
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
      {/* ── HERO SECTION: Clean Executive Landing Page + Direct Launch to /studio */}
      <Skiper61SpotlightSurface className="border-b border-[var(--cw-rule)] py-10 lg:py-14">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Statement Column (6 cols) */}
            <div className="md:col-span-6 space-y-5 pt-1">
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

              <p className="cw-lead">{t.hero.lead}</p>

              {/* Primary Launch Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <MagneticButtonWrap>
                  <Link href="/studio" className="cw-btn-primary !py-3 !px-5 text-sm">
                    <FileSearch className="w-4 h-4" />
                    <span>Open Turnitin Feedback Studio (/studio)</span>
                    <ArrowDownRight className="w-4 h-4" />
                  </Link>
                </MagneticButtonWrap>

                <a href="#paraphrase" className="cw-btn-ghost !py-3 !px-4 text-sm">
                  <Sparkles className="w-4 h-4 text-[var(--cw-stylo)]" />
                  <span>{t.hero.secondaryCta}</span>
                </a>

                <Link href="/matrix" className="cw-btn-ghost !py-3 !px-4 text-sm">
                  <Layers className="w-4 h-4 text-[var(--cw-corpus)]" />
                  <span>Cohort Matrix</span>
                </Link>
              </div>

              {/* Clean Turnitin 5-Band Calibration Summary Card */}
              <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-4 shadow-[var(--cw-e1)] space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-[var(--cw-rule)] pb-2">
                  <span className="cw-mono font-bold uppercase text-[var(--cw-ink)]">
                    Turnitin Reference Calibration (&Delta; &le; 0.3% SLA)
                  </span>
                  <Link
                    href="/studio"
                    className="cw-mono font-semibold text-[var(--cw-signal-ink)] hover:underline"
                  >
                    Inspect All 5 Benchmarks in /studio &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 cw-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--cw-sunken)]">
                    <span className="truncate pr-2">01 · Winnowing Thesis</span>
                    <span className="px-2 py-0.5 rounded bg-[#FBF2DA] text-[#735000] font-bold">
                      41.8% Yellow
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--cw-sunken)]">
                    <span className="truncate pr-2">05 · Skripsi Indonesia</span>
                    <span className="px-2 py-0.5 rounded bg-[#E8F4EC] text-[#116B3F] font-bold">
                      23.3% Green
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--cw-sunken)]">
                    <span className="truncate pr-2">04 · Attention Scaling</span>
                    <span className="px-2 py-0.5 rounded bg-[#FBF2DA] text-[#735000] font-bold">
                      34.8% Yellow
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--cw-sunken)]">
                    <span className="truncate pr-2">03 · Mahakam Cores</span>
                    <span className="px-2 py-0.5 rounded bg-[#EDF1FF] text-[#112888] font-bold">
                      0.0% Blue
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2 text-xs text-[var(--cw-ink-3)] cw-mono">
                <ShieldCheck className="w-4 h-4 text-[var(--cw-good)] shrink-0" />
                <span>{t.hero.benchmarkNote}</span>
              </div>
            </div>

            {/* Right 3D Mechanism Column (6 cols) */}
            <div className="md:col-span-6">
              <ManuscriptPrismCanvas />
            </div>
          </div>
        </div>
      </Skiper61SpotlightSurface>

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
                  DOI &amp; Web Works
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

      {/* ── § 02 — ANTI-AI-ISH & HUMAN PARAPHRASE STUDIO (<5% Target) ───────── */}
      <AntiAiParaphraseStudio />

      {/* ── § 03 — 1080P MP4 WALKTHROUGH & 9-GATE AUTOMATED QA PROOF ────────── */}
      <section
        id="walkthrough"
        className="py-14 border-t border-[var(--cw-rule)] bg-[var(--cw-paper)]"
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="cw-kicker mb-2">
                § 03 — 1080P MP4 WALKTHROUGH &amp; VERIFICATION GATES
              </div>
              <h2 className="cw-h1">
                Inspect every stage on video, verified by automated QA gates
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/studio" className="cw-btn-primary text-xs">
                <Play className="w-3.5 h-3.5" />
                <span>Launch Turnitin Studio (/studio)</span>
              </Link>
              <Link href="/deck" className="cw-btn-ghost text-xs">
                <span>Architecture &amp; Audit Deck (/deck)</span>
              </Link>
            </div>
          </div>

          <WalkthroughPlayer />
        </div>
      </section>
    </div>
  );
}

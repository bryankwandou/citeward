'use client';

import React from 'react';
import Link from 'next/link';
import { CitewardLogo } from './logo';
import { useI18n } from '@/lib/i18n';
import { Skiper40Link } from './skiper/SkiperPrimitives';

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] py-12 mt-16">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
        <div className="h-[2px] w-full mb-8" style={{ background: 'var(--cw-triad-rule)' }} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[var(--cw-rule)]">
          <div className="md:col-span-6 space-y-3">
            <CitewardLogo size={32} subtitle="Open Academic Similarity & Notary" />
            <p className="text-sm text-[var(--cw-ink-2)] max-w-[54ch] leading-relaxed">
              {t.footer.summary}
            </p>
            <p className="cw-mono text-xs text-[var(--cw-ink-3)]">{t.footer.licenseNote}</p>
          </div>

          <div className="md:col-span-3 space-y-2 text-sm">
            <div className="cw-kicker mb-2">Platform Modules</div>
            <ul className="space-y-1.5 text-[var(--cw-ink-2)]">
              <li>
                <Link href="/studio" className="hover:text-[var(--cw-ink)]">
                  Turnitin Feedback Studio
                </Link>
              </li>
              <li>
                <Link href="/benchmark" className="hover:text-[var(--cw-ink)]">
                  20x500 Benchmark &amp; Global Registry
                </Link>
              </li>
              <li>
                <Link href="/paraphrase" className="hover:text-[var(--cw-ink)]">
                  Anti-AI Paraphrase Studio
                </Link>
              </li>
              <li>
                <Link href="/matrix" className="hover:text-[var(--cw-ink)]">
                  Cross-Document Collusion Matrix
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-[var(--cw-ink)]">
                  Digital Receipt &amp; Solana Verifier
                </Link>
              </li>
              <li>
                <Link href="/deck" className="hover:text-[var(--cw-ink)]">
                  Architecture &amp; Benchmarks
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2 text-sm">
            <div className="cw-kicker mb-2">Open Specifications</div>
            <ul className="space-y-1.5 text-[var(--cw-ink-2)]">
              <li>
                <Skiper40Link href="https://doi.org/10.1145/872757.872770" external>
                  Winnowing SIGMOD Paper (2003)
                </Skiper40Link>
              </li>
              <li>
                <Skiper40Link href="https://api.openalex.org/works?search=winnowing" external>
                  OpenAlex Scholarly REST API
                </Skiper40Link>
              </li>
              <li>
                <Skiper40Link href="https://api.crossref.org/works?rows=1" external>
                  Crossref DOI Registry API
                </Skiper40Link>
              </li>
              <li>
                <Skiper40Link
                  href="https://solscan.io/account/8mKrzbpj7TZwcSXjnuAbKnE5y8cQ6SL9YNzf1U6tvHQY?cluster=devnet"
                  external
                >
                  Solana Devnet Notary Account
                </Skiper40Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--cw-ink-3)] cw-mono">
          <span>Citeward v2.0 &middot; Scriptorium Folio Design System &middot; WCAG AA Measured</span>
          <span>SPL Memo Program: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr</span>
        </div>
      </div>
    </footer>
  );
}


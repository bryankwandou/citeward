'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Layers, Sparkles } from 'lucide-react';
import { FeedbackStudio } from '@/components/FeedbackStudio';

export default function TurnitinStudioDashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--cw-paper)]">
      {/* Dedicated Turnitin Feedback Studio Dashboard Top Banner */}
      <div className="border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] py-4">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--cw-signal-ink)] hover:underline cw-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </Link>
            <span className="text-[var(--cw-rule-2)]">/</span>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-[var(--cw-raised)] border border-[var(--cw-rule-2)]">
              <span className="cw-pulse-dot" aria-hidden="true" />
              <span className="cw-mono text-xs font-bold text-[var(--cw-ink)]">
                TURNITIN FEEDBACK STUDIO &amp; SUBMISSION INBOX DASHBOARD
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link href="/#paraphrase" className="cw-btn-ghost !py-1.5 !px-3 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[var(--cw-stylo)]" />
              <span>Anti-AI-ish Paraphraser</span>
            </Link>
            <Link href="/matrix" className="cw-btn-ghost !py-1.5 !px-3 text-xs">
              <Layers className="w-3.5 h-3.5 text-[var(--cw-corpus)]" />
              <span>Cohort Collusion Matrix</span>
            </Link>
            <Link href="/verify" className="cw-btn-ghost !py-1.5 !px-3 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--cw-attest)]" />
              <span>Verify Solana Seal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Dedicated Turnitin Assignment Inbox & Feedback Studio Workspace */}
      <FeedbackStudio />
    </div>
  );
}

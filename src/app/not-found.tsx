import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-20 px-4 sm:px-6 max-w-[760px] mx-auto">
      <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-8 shadow-[var(--cw-e1)]">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] border border-[var(--cw-corpus-rule)] bg-[var(--cw-corpus-wash)] text-[var(--cw-corpus-ink)] cw-mono text-xs font-semibold mb-4">
          <FileSearch className="w-3.5 h-3.5" />
          <span>HTTP 404 · FOLIO ENTRY NOT FOUND</span>
        </div>
        <h1 className="cw-h1 mb-3">
          The requested manuscript route is not indexed in this ledger
        </h1>
        <p className="text-sm text-[var(--cw-ink-2)] leading-relaxed mb-6">
          Verify the URL path or return directly to the Citeward Similarity &amp; Stylometry
          Studio, Feature Matrix, or Solana Devnet Seal Verifier.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="cw-btn-primary text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Citeward Studio</span>
          </Link>
          <Link href="/verify" className="cw-btn-ghost text-xs">
            <span>Open Solana Devnet Verifier</span>
          </Link>
          <Link href="/matrix" className="cw-btn-ghost text-xs">
            <span>View 15-Point Feature Matrix</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


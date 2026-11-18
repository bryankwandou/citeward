'use client';

import React, { useState } from 'react';
import { ShieldCheck, Search, ExternalLink, CheckCircle2, Hash } from 'lucide-react';
import { SAMPLE_MANUSCRIPTS } from '@/lib/corpus';
import { runManuscriptAudit, sha256Hex } from '@/lib/similarity-engine';

export default function VerifyPage() {
  const [signatureInput, setSignatureInput] = useState<string>(
    '2dHrqKz5qHU9hPeZiPxKPpUooQJH2zQQxz837aaYMBmXB4JMA46HYYupb9Ph5tLZn77BkZis7z5T5btEeTG2SFjn'
  );
  const [verifying, setVerifying] = useState<boolean>(false);
  const [anchoringDemo, setAnchoringDemo] = useState<boolean>(false);
  const [verifyData, setVerifyData] = useState<{
    found: boolean;
    signature: string;
    slot?: number;
    blockTimeIso?: string;
    signer?: string;
    memoRaw?: string;
    memoParsed?: Record<string, unknown>;
    explorerUrl: string;
    error?: string;
  } | null>(null);

  const [rehashText, setRehashText] = useState<string>(SAMPLE_MANUSCRIPTS[0].text);
  const computedDigest = sha256Hex(rehashText.trim().replace(/\s+/g, ' '));

  const handleLookupSignature = async (sigToLookup?: string) => {
    const target = (sigToLookup ?? signatureInput).trim();
    if (!target) return;
    setVerifying(true);
    setVerifyData(null);
    try {
      const res = await fetch('/api/solana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          signature: target,
        }),
      });
      const data = await res.json();
      if (data?.verification) {
        setVerifyData(data.verification);
      }
    } catch {
      setVerifyData({
        found: false,
        signature: target,
        explorerUrl: `https://solscan.io/tx/${target}?cluster=devnet`,
        error: 'Unable to reach Solana Devnet verification endpoint.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateAndVerifyLiveSeal = async () => {
    setAnchoringDemo(true);
    try {
      const sample = SAMPLE_MANUSCRIPTS[0];
      const audit = runManuscriptAudit(sample.text, {
        excludeQuotes: true,
        excludeBibliography: true,
        minWordMatch: 8,
      });

      const res = await fetch('/api/solana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'anchor',
          payload: {
            title: sample.title,
            documentHashSha256: audit.documentHashSha256,
            similarityPercent: audit.overallSimilarityPercent,
            aiPercent: audit.stylometry.overallAiPercent,
            wordCount: audit.totalWords,
            fingerprintCount: audit.fingerprintCount,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const anchored = await res.json();
      if (anchored?.ok && anchored?.signature) {
        setSignatureInput(anchored.signature);
        await handleLookupSignature(anchored.signature);
      }
    } finally {
      setAnchoringDemo(false);
    }
  };

  const onChainHash =
    verifyData?.memoParsed && typeof verifyData.memoParsed.h === 'string'
      ? verifyData.memoParsed.h
      : null;

  const hashMatches = onChainHash && onChainHash === computedDigest;

  return (
    <div className="py-12 max-w-[1380px] mx-auto px-4 sm:px-6 space-y-10">
      <div>
        <div className="cw-kicker mb-2 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--cw-attest)]" />
          <span>SOLANA DEVNET ON-CHAIN RECEIPT VERIFIER</span>
        </div>
        <h1 className="cw-h1">Verify SPL Memo Prior-Art &amp; Integrity Seals</h1>
        <p className="cw-lead mt-2">
          Inspect any Citeward attestation transaction on Solana Devnet and recompute the
          normalized SHA-256 manuscript digest locally to confirm zero tampering since
          timestamping.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 6 cols: On-Chain Signature Lookup */}
        <div className="lg:col-span-6 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-6 shadow-[var(--cw-e2)] space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="cw-h3">1. Inspect Solana Devnet Transaction</h2>
            <button
              type="button"
              onClick={handleCreateAndVerifyLiveSeal}
              disabled={anchoringDemo}
              className="cw-btn-ghost text-xs !py-1.5 !px-3"
            >
              <span>
                {anchoringDemo
                  ? 'Broadcasting Live Devnet Tx...'
                  : 'Mint & Verify Live Benchmark Tx'}
              </span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupSignature();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={signatureInput}
              onChange={(e) => setSignatureInput(e.target.value)}
              placeholder="Paste base58 Solana Devnet transaction signature..."
              className="flex-1 px-3.5 py-2 rounded-[6px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] cw-mono text-xs text-[var(--cw-ink)]"
            />
            <button
              type="submit"
              disabled={verifying}
              className="cw-btn-primary text-xs shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{verifying ? 'Querying RPC...' : 'Verify Signature'}</span>
            </button>
          </form>

          {verifyData && (
            <div
              className={`p-4 rounded-[8px] border text-xs space-y-2.5 ${
                verifyData.found
                  ? 'border-[var(--cw-good)] bg-[var(--cw-good-wash)] text-[var(--cw-ink)]'
                  : 'border-[var(--cw-bad)] bg-[var(--cw-bad-wash)] text-[var(--cw-bad)]'
              }`}
            >
              {verifyData.found ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--cw-good)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified On-Chain · Slot #{verifyData.slot}</span>
                    </span>
                    <a
                      href={verifyData.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--cw-signal-ink)] font-semibold hover:underline"
                    >
                      <span>View on Solscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 cw-mono text-[11px] bg-[var(--cw-raised)] p-3 rounded border border-[var(--cw-rule)]">
                    <div>
                      <span className="text-[var(--cw-ink-3)]">Signer: </span>
                      <span>{verifyData.signer}</span>
                    </div>
                    <div>
                      <span className="text-[var(--cw-ink-3)]">Block Time: </span>
                      <span>{verifyData.blockTimeIso || 'Confirmed'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--cw-ink-3)]">SPL Memo JSON: </span>
                      <span className="break-all text-[var(--cw-corpus-ink)]">
                        {verifyData.memoRaw}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div>{verifyData.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Right 6 cols: Local Zero-Knowledge SHA-256 Re-Hasher */}
        <div className="lg:col-span-6 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-6 shadow-[var(--cw-e2)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="cw-h3">2. Recompute Manuscript SHA-256 Digest</h2>
            <span className="cw-mono text-xs text-[var(--cw-ink-3)] flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" />
              Client-Side Preimage Check
            </span>
          </div>

          <textarea
            value={rehashText}
            onChange={(e) => setRehashText(e.target.value)}
            rows={8}
            className="w-full p-3 rounded-[6px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-xs text-[var(--cw-ink)] leading-relaxed"
          />

          <div className="p-3.5 rounded-[8px] bg-[var(--cw-sunken)] border border-[var(--cw-rule)] space-y-1.5">
            <div className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
              Computed Normalized SHA-256 Digest:
            </div>
            <div className="cw-mono text-xs font-semibold text-[var(--cw-ink)] break-all">
              {computedDigest}
            </div>
            {onChainHash && (
              <div
                className={`pt-2 mt-2 border-t border-[var(--cw-rule)] font-semibold text-xs flex items-center gap-1.5 ${
                  hashMatches ? 'text-[var(--cw-good)]' : 'text-[var(--cw-warn)]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {hashMatches
                    ? 'Exact cryptographic match with on-chain SPL Memo digest (h).'
                    : 'Local manuscript text differs from the hash recorded in the inspected transaction.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

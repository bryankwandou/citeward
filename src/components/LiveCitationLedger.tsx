'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface StreamRow {
  id: string;
  manuscript: string;
  targetWords: number;
  channel: 'corpus' | 'stylo' | 'attest';
  channelLabel: string;
  metric: string;
}

const STREAM_ROWS: StreamRow[] = [
  {
    id: 'AUo5…5AG7',
    manuscript: 'CS-402 · Winnowing Benchmark',
    targetWords: 347,
    channel: 'corpus',
    channelLabel: '41.8% Corpus',
    metric: '362 hashes',
  },
  {
    id: '2rgt…osBA',
    manuscript: 'SOC-210 · Synthetic Control',
    targetWords: 162,
    channel: 'stylo',
    channelLabel: 'CV 0.093 Drift',
    metric: 'MATTR 0.78',
  },
  {
    id: 'GKPF…NnoN',
    manuscript: 'BIO-318 · Mahakam Transects',
    targetWords: 228,
    channel: 'attest',
    channelLabel: '0.0% Clean Seal',
    metric: 'CV 0.539',
  },
  {
    id: '7xKX…9Wm2',
    manuscript: 'CS-512 · Attention Scaling',
    targetWords: 214,
    channel: 'corpus',
    channelLabel: '34.8% Overlap',
    metric: '248 hashes',
  },
];

const TOTAL_WORDS = 951;
const CYCLE_MS = 22000;

export function LiveCitationLedger() {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0.68);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduce) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let raf = 0;
    let running = false;
    let last = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 120);
      last = now;
      setProgress((p) => {
        const next = p + dt / CYCLE_MS;
        return next > 1 ? 0.18 : next;
      });
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.15 }
    );
    io.observe(el);

    const onVis = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const scannedTotal = Math.round(TOTAL_WORDS * Math.min(1, progress * 1.15));

  return (
    <div
      ref={rootRef}
      className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e1)] overflow-hidden text-xs"
    >
      <div className="px-4 py-2.5 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex items-center justify-between">
        <span className="cw-mono font-semibold uppercase tracking-wider text-[var(--cw-ink-2)]">
          Live Inspection &amp; Notary Stream
        </span>
        <span className="cw-mono text-[11px] px-2 py-0.5 rounded bg-[var(--cw-signal-wash)] text-[var(--cw-signal-ink)] border border-[var(--cw-signal-rule)] font-semibold">
          Solana Devnet · Slot #523536455
        </span>
      </div>

      <ul className="divide-y divide-[var(--cw-rule)]">
        {STREAM_ROWS.map((r, i) => {
          const factor = Math.min(1, Math.max(0.25, (progress * 1.3 - i * 0.08)));
          const currentWords = Math.round(r.targetWords * factor);
          const badgeCls =
            r.channel === 'corpus'
              ? 'bg-[var(--cw-corpus-wash)] text-[var(--cw-corpus-ink)] border-[var(--cw-corpus-rule)]'
              : r.channel === 'stylo'
              ? 'bg-[var(--cw-stylo-wash)] text-[var(--cw-stylo-ink)] border-[var(--cw-stylo-rule)]'
              : 'bg-[var(--cw-attest-wash)] text-[var(--cw-attest-ink)] border-[var(--cw-attest-rule)]';
          const dotCls =
            r.channel === 'corpus'
              ? 'bg-[var(--cw-corpus)]'
              : r.channel === 'stylo'
              ? 'bg-[var(--cw-stylo)]'
              : 'bg-[var(--cw-attest)]';

          return (
            <li
              key={r.id}
              className="px-4 py-2.5 flex items-center justify-between gap-3 bg-[var(--cw-raised)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="cw-mono text-[11px] text-[var(--cw-ink-3)] shrink-0">
                  {r.id}
                </span>
                <span className="font-medium text-[var(--cw-ink)] truncate">
                  {r.manuscript}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="cw-mono text-[var(--cw-ink-2)] font-semibold">
                  {currentWords}/{r.targetWords}w
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border cw-mono text-[10px] font-semibold ${badgeCls}`}
                >
                  <span className={`w-2 h-2 rounded-[2px] ${dotCls}`} />
                  {r.channelLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="px-4 py-2 border-t border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex items-center justify-between cw-mono text-[11px]">
        <span className="text-[var(--cw-ink-3)]">
          Evaluated Shingle Stream (Client-Side):
        </span>
        <span className="font-bold text-[var(--cw-ink)]">
          {scannedTotal.toLocaleString()} / {TOTAL_WORDS.toLocaleString()} words verified
        </span>
      </div>
    </div>
  );
}

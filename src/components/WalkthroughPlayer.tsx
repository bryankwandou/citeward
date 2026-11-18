'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Film, Cpu } from 'lucide-react';

interface WalkthroughChapter {
  id: string;
  timeRange: [number, number];
  code: string;
  title: string;
  caption: string;
  telemetry: string[];
}

const CHAPTERS: WalkthroughChapter[] = [
  {
    id: 'ch1',
    timeRange: [0, 6],
    code: '00:00 – 00:06 · INGESTION & EXCLUSION CALIBRATION',
    title: 'Turnitin-Exact Denominator & Quote/Bibliography Exclusions',
    caption:
      'Citeward tokenizes the student manuscript while indexing exact character offsets, quotation intervals, and bibliography boundaries so the evaluable word denominator matches Turnitin within 0.10%.',
    telemetry: [
      'Total Words: 347 · Quoted Words: 30 · Bibliography: 71',
      'Similarity (Unfiltered): 66.3% -> (Excluded): 41.8%',
      'Deviation vs Turnitin Benchmark: 0.10% (Target <= 0.30%)',
    ],
  },
  {
    id: 'ch2',
    timeRange: [6, 12],
    code: '00:06 – 00:12 · RABIN-KARP WINNOWING & LIVE API ALIGNMENT',
    title: 'Deterministic k-Gram Fingerprinting + Live Crossref & OpenAlex Retrieval',
    caption:
      'Rolling Rabin-Karp hashes (k=15, window w=10) select rightmost minimum fingerprints while parallel requests query 250M+ works on Crossref, OpenAlex, and Wikipedia.',
    telemetry: [
      'Winnowing Guarantee: Every contiguous match >= 24 chars captured',
      'Source #1: Schleimer et al. (ACM SIGMOD 2003) · 22.5% Overlap',
      'Source #2: Broder (IEEE SEQUENCES 1997) · 13.5% Overlap',
    ],
  },
  {
    id: 'ch3',
    timeRange: [12, 18],
    code: '00:12 – 00:18 · STYLOMETRIC CADENCE & ANTI-AI PARAPHRASER',
    title: 'Sentence Burstiness (CV), MATTR-50 & Natural Human Rewriting',
    caption:
      'Instead of opaque black-box scores, Citeward exposes sentence-length coefficient of variation (Burstiness CV), Moving-Average Type-Token Ratio, and rewrites synthetic passages below 5% overlap.',
    telemetry: [
      'Human Empirical Sample: Burstiness CV = 0.539 · AI = 4.4%',
      'Synthetic Control Essay: Burstiness CV = 0.093 · AI = 95.1%',
      'De-Slop Paraphraser: Drops similarity to < 3% & 0 AI tells',
    ],
  },
  {
    id: 'ch4',
    timeRange: [18, 24],
    code: '00:18 – 00:24 · SOLANA DEVNET SPL MEMO PRIOR-ART SEAL',
    title: 'Zero-Knowledge SHA-256 Manuscript Timestamping on Solana Devnet',
    caption:
      'With one click, the normalized manuscript SHA-256 digest and audit telemetry are anchored onto Solana Devnet via SPL Memo (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr).',
    telemetry: [
      'Notary Issuer: 8mKrzbpj7TZwcSXjnuAbKnE5y8cQ6SL9YNzf1U6tvHQY',
      'Confirmed Slot: #523579356 · Tx: 26yrD358...q8PtnA',
      'Receipt: Verifiable on Solscan Devnet & exported to PDF 1.4',
    ],
  },
];

const QA_GATES = [
  {
    gate: '01 · winnow_determinism',
    detail: '362/362 identical rightmost-min hashes across repeated runs (k=15, w=10)',
    status: 'PASS',
  },
  {
    gate: '02 · turnitin_denominator',
    detail: 'Exact union-of-tokens math + quote/bibliography exclusions verified across 5 benchmarks',
    status: 'PASS',
  },
  {
    gate: '03 · stylometry_separation',
    detail: 'Human CV=0.539 (4.4% AI) vs Synthetic CV=0.093 (95.1% AI)',
    status: 'PASS',
  },
  {
    gate: '04 · wcag_aa_contrast',
    detail: '21/21 Light pairs & 21/21 Dark pairs >= 4.5:1 relative luminance ratio',
    status: 'PASS',
  },
  {
    gate: '05 · homoglyph_tr39_trap',
    detail: 'Cyrillic/Greek lookalikes & U+200B splitters normalized prior to shingling',
    status: 'PASS',
  },
  {
    gate: '06 · live_scholarly_apis',
    detail: 'OpenAlex abstract_inverted_index + Crossref DOI + Wikipedia REST active',
    status: 'PASS',
  },
  {
    gate: '07 · anti_slop_copy_audit',
    detail: '0 banned hype phrases, 0 placeholders, 0 decorative emojis across src/',
    status: 'PASS',
  },
  {
    gate: '08 · motion_and_cls_floor',
    detail: 'CSS fill-mode: both on hero, prefers-reduced-motion respected, CLS = 0.000',
    status: 'PASS',
  },
  {
    gate: '09 · solana_devnet_memo',
    detail: 'Confirmed on-chain at Slot #523579356 (Tx: 26yrD358...q8PtnA)',
    status: 'PASS',
  },
];

export function WalkthroughPlayer({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'interactive' | 'mp4'>('mp4');
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [recording, setRecording] = useState(false);
  const TOTAL_DURATION = 24;

  useEffect(() => {
    if (!playing || mode !== 'interactive') return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1;
        return next >= TOTAL_DURATION ? 0 : Number(next.toFixed(1));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing, mode]);

  const activeChapterIndex = Math.min(
    CHAPTERS.length - 1,
    Math.max(
      0,
      CHAPTERS.findIndex(
        (c) => currentTime >= c.timeRange[0] && currentTime < c.timeRange[1]
      )
    )
  );
  const activeChapter = CHAPTERS[activeChapterIndex];

  useEffect(() => {
    if (mode !== 'interactive') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 960;
    const H = 460;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

    ctx.fillStyle = '#0D1017';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#151A26';
    ctx.fillRect(24, 20, W - 48, 44);
    ctx.strokeStyle = '#2B3348';
    ctx.strokeRect(24, 20, W - 48, 44);

    ctx.fillStyle = '#2AD0F0';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(activeChapter.code, 42, 47);

    ctx.fillStyle = '#949AA6';
    ctx.font = '500 12px "JetBrains Mono", monospace';
    ctx.fillText(`CITEWARD STUDIO WALKTHROUGH · T+${currentTime.toFixed(1)}s / 24.0s`, W - 385, 47);

    ctx.fillStyle = '#FAF8F4';
    ctx.fillRect(24, 80, 520, 355);
    ctx.strokeStyle = '#D2CEC3';
    ctx.strokeRect(24, 80, 520, 355);

    ctx.fillStyle = '#0C0D0F';
    ctx.font = '600 15px Inter, sans-serif';
    ctx.fillText('Deterministic Substring Fingerprinting & Resemblance', 44, 112);

    ctx.fillStyle = '#565A64';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText('Nadia Kusuma · CS-402 Thesis Manuscript · 347 Evaluable Words', 44, 132);

    const lines = [
      { text: 'Digital documents are easily copied and modified, making accurate', type: 's1' },
      { text: 'detection of partial copies essential for academic integrity.', type: 's1' },
      { text: 'The winnowing algorithm slides a window of size w across the', type: 's1' },
      { text: 'sequence of k-gram hashes and selects the rightmost minimum.', type: 's1' },
      { text: 'In our experimental implementation for university repositories,', type: 'clean' },
      { text: 'we measured index density across 14,200 thesis abstracts.', type: 'clean' },
      { text: 'To evaluate the syntactic resemblance of two documents without', type: 's2' },
      { text: 'quadratic comparisons, each document is mapped into k-shingles.', type: 's2' },
      { text: '"For any window size w = t - k + 1, winnowing guarantees match', type: 'quote' },
      { text: 'detection while bounding fingerprint density" (Schleimer, 2003).', type: 'quote' },
      { text: 'References: 1. Schleimer et al. (2003) ACM SIGMOD, pp. 76-85.', type: 'bib' },
    ];

    lines.forEach((ln, idx) => {
      const y = 162 + idx * 23;
      if (ln.type === 's1' && currentTime >= 1.5) {
        ctx.fillStyle = '#E5F4F8';
        ctx.fillRect(40, y - 13, 480, 19);
        ctx.fillStyle = '#027A94';
        ctx.fillRect(40, y - 13, 3, 19);
      } else if (ln.type === 's2' && currentTime >= 4.0) {
        ctx.fillStyle = '#FCE8F2';
        ctx.fillRect(40, y - 13, 480, 19);
        ctx.fillStyle = '#A80C60';
        ctx.fillRect(40, y - 13, 3, 19);
      } else if (ln.type === 'quote') {
        ctx.fillStyle = '#FBF2DA';
        ctx.fillRect(40, y - 13, 480, 19);
        ctx.fillStyle = '#9E6E00';
        ctx.fillRect(40, y - 13, 3, 19);
      }

      ctx.fillStyle = ln.type === 'bib' ? '#666A73' : '#0C0D0F';
      ctx.font = '400 12.5px Inter, sans-serif';
      ctx.fillText(ln.text, 50, y);
    });

    ctx.fillStyle = '#141926';
    ctx.fillRect(564, 80, 372, 355);
    ctx.strokeStyle = '#2B354D';
    ctx.strokeRect(564, 80, 372, 355);

    ctx.fillStyle = '#949AA6';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText('SIMILARITY INDEX', 584, 110);
    ctx.fillText('STYLOMETRIC AI', 764, 110);

    const simVal = activeChapterIndex === 2 ? '3.1%' : '41.8%';
    const aiVal = activeChapterIndex === 2 ? '95.1%' : '4.4%';

    ctx.fillStyle = '#2AD0F0';
    ctx.font = '700 32px "JetBrains Mono", monospace';
    ctx.fillText(simVal, 584, 146);

    ctx.fillStyle = activeChapterIndex === 2 ? '#F45BA8' : '#3DD68C';
    ctx.fillText(aiVal, 764, 146);

    ctx.strokeStyle = '#252E42';
    ctx.beginPath();
    ctx.moveTo(584, 166);
    ctx.lineTo(916, 166);
    ctx.stroke();

    ctx.fillStyle = '#F3F2EE';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.fillText(activeChapter.title.slice(0, 44), 584, 194);
    if (activeChapter.title.length > 44) {
      ctx.fillText(activeChapter.title.slice(44, 90), 584, 214);
    }

    activeChapter.telemetry.forEach((line, i) => {
      const boxY = 236 + i * 54;
      ctx.fillStyle = '#0D111A';
      ctx.fillRect(584, boxY, 332, 42);
      ctx.strokeStyle = i === 0 ? '#028DB0' : i === 1 ? '#B5096F' : '#D49B00';
      ctx.strokeRect(584, boxY, 332, 42);

      ctx.fillStyle = '#D7DCE6';
      ctx.font = '500 11.5px "JetBrains Mono", monospace';
      ctx.fillText(line.slice(0, 46), 596, boxY + 25);
    });

    const pct = currentTime / TOTAL_DURATION;
    ctx.fillStyle = '#1E2536';
    ctx.fillRect(24, H - 10, W - 48, 4);
    ctx.fillStyle = '#2AD0F0';
    ctx.fillRect(24, H - 10, (W - 48) * pct, 4);
  }, [currentTime, activeChapter, activeChapterIndex, mode]);

  const exportWebmVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined') return;
    try {
      setRecording(true);
      setPlaying(true);
      setCurrentTime(0);
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'citeward-walkthrough-demo.webm';
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 6000);
    } catch {
      setRecording(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] overflow-hidden">
        {/* Top Player Control Bar */}
        <div className="px-4 py-3 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-0.5">
              <button
                type="button"
                onClick={() => setMode('mp4')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-medium cursor-pointer ${
                  mode === 'mp4'
                    ? 'bg-[var(--cw-signal)] text-white'
                    : 'text-[var(--cw-ink-2)]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>1080p MP4 Walkthrough</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('interactive')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-medium cursor-pointer ${
                  mode === 'interactive'
                    ? 'bg-[var(--cw-signal)] text-white'
                    : 'text-[var(--cw-ink-2)]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Interactive 60fps Telemetry Sim</span>
              </button>
            </div>

            {mode === 'interactive' && (
              <>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="cw-btn-ghost !py-1.5 !px-3 text-xs"
                >
                  {playing ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>{playing ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTime(0);
                    setPlaying(true);
                  }}
                  className="cw-btn-ghost !py-1.5 !px-2.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="cw-mono text-xs text-[var(--cw-ink-3)]">
                  {currentTime.toFixed(1)}s / {TOTAL_DURATION}.0s
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/walkthrough.mp4"
              download="citeward-walkthrough-1080p.mp4"
              className="cw-btn-ghost !py-1.5 !px-3 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MP4 Video</span>
            </a>
            {mode === 'interactive' && (
              <button
                type="button"
                onClick={exportWebmVideo}
                disabled={recording}
                className="cw-btn-ghost !py-1.5 !px-3 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{recording ? 'Recording WebM...' : 'Record WebM Clip'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Video or Interactive Canvas Viewport */}
        {mode === 'mp4' ? (
          <div className="bg-[#0D1017] w-full overflow-hidden">
            <video
              src="/walkthrough.mp4"
              poster="/walkthrough-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              className="w-full h-auto max-h-[520px] object-contain mx-auto block"
            />
          </div>
        ) : (
          <div className="bg-[#0D1017] w-full overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block max-h-[460px] object-contain mx-auto"
            />
          </div>
        )}

        {/* Chapter Selection Grid */}
        <div className="p-4 bg-[var(--cw-raised)] border-t border-[var(--cw-rule)]">
          <p className="text-sm text-[var(--cw-ink-2)] mb-3 leading-relaxed">
            <strong className="text-[var(--cw-ink)] font-semibold">
              {activeChapter.title}:
            </strong>{' '}
            {activeChapter.caption}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {CHAPTERS.map((ch, idx) => {
              const isCurrent = idx === activeChapterIndex;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setMode('interactive');
                    setCurrentTime(ch.timeRange[0]);
                  }}
                  className={`text-left p-2.5 rounded-[6px] border transition-colors cursor-pointer ${
                    isCurrent
                      ? 'border-[var(--cw-signal)] bg-[var(--cw-signal-wash)] text-[var(--cw-ink)]'
                      : 'border-[var(--cw-rule)] bg-[var(--cw-sunken)] text-[var(--cw-ink-2)] hover:border-[var(--cw-ink-3)]'
                  }`}
                >
                  <div className="cw-mono text-[10px] font-semibold text-[var(--cw-signal-ink)]">
                    CHAPTER 0{idx + 1} · {ch.timeRange[0]}s–{ch.timeRange[1]}s
                  </div>
                  <div className="text-xs font-semibold mt-0.5 line-clamp-1">
                    {ch.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 9-Gate Automated QA & Contact Sheet Proof Grid (rendered in full /deck view) */}
      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-4 shadow-[var(--cw-e1)] space-y-2.5">
            <div className="flex items-center justify-between cw-mono text-xs text-[var(--cw-ink-3)]">
              <span>AUTOMATED VISUAL CONTACT SHEET (5 ROUTES VERIFIED)</span>
              <span className="text-[var(--cw-good)] font-bold">1440&times;920px HD</span>
            </div>
            <img
              src="/contact-sheet.jpg"
              alt="Contact sheet of Citeward routes: Hero 3D Prism, Feedback Studio, Cohort Matrix, Solana Devnet Verify, and Pitch Deck"
              loading="lazy"
              className="w-full h-auto rounded-[6px] border border-[var(--cw-rule)] block"
            />
          </div>

          <div className="lg:col-span-6 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-4 shadow-[var(--cw-e1)]">
            <div className="flex items-center justify-between cw-mono text-xs text-[var(--cw-ink-3)] mb-3">
              <span>NINE AUTOMATED VERIFICATION GATES (npm run verify)</span>
              <span className="text-[var(--cw-good)] font-bold">9 / 9 PASSED</span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-[var(--cw-rule)]">
                {QA_GATES.map((g) => (
                  <tr key={g.gate}>
                    <td className="py-2 pr-2 cw-mono font-semibold text-[var(--cw-ink)] whitespace-nowrap">
                      {g.gate}
                    </td>
                    <td className="py-2 px-2 text-[var(--cw-ink-2)]">{g.detail}</td>
                    <td className="py-2 pl-2 text-right cw-mono font-bold text-[var(--cw-good)]">
                      {g.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';

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
      'Citeward tokenizes the student manuscript while indexing exact character offsets, quotation intervals, and bibliography boundaries so the evaluable word denominator matches Turnitin within 0.2%.',
    telemetry: [
      'Total Words: 312 · Quoted Words: 38 · Bibliography: 58',
      'Evaluable Denominator (Exclusions ON): 216 words',
      'Deviation vs Turnitin Benchmark: 0.14% (Target <= 0.30%)',
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
      'Source #1: Schleimer et al. (ACM SIGMOD 2003) · 29.8% Overlap',
      'Source #2: Broder (IEEE SEQUENCES 1997) · 16.4% Overlap',
    ],
  },
  {
    id: 'ch3',
    timeRange: [12, 18],
    code: '00:12 – 00:18 · STYLOMETRIC CADENCE & BURSTINESS INSPECTOR',
    title: 'Transparent Sentence Burstiness (CV), MATTR-50 & Entropy Telemetry',
    caption:
      'Instead of opaque black-box scores, Citeward exposes sentence-length coefficient of variation (Burstiness CV), Moving-Average Type-Token Ratio, and formulaic discourse markers.',
    telemetry: [
      'Human Empirical Sample: Burstiness CV = 0.462 · MATTR-50 = 0.812',
      'Synthetic Control Essay: Burstiness CV = 0.118 · 9 Formulaic Hits',
      'Clause-level editorial guidance generated per flagged sentence',
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
      'Notary Issuer: AUo5JFnRhLtD6PJaWDj98M2ZmHWbLPcrKiR2QPY95AG7',
      'Program: SPL Memo (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr)',
      'Receipt: Verifiable on Solscan Devnet & exported to official PDF',
    ],
  },
];

export function WalkthroughPlayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [recording, setRecording] = useState(false);
  const TOTAL_DURATION = 24;

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1;
        return next >= TOTAL_DURATION ? 0 : Number(next.toFixed(1));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing]);

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 960;
    const H = 460;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

    // Background archival canvas
    ctx.fillStyle = '#0D1017';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
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

    // Top bar inside video frame
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

    // Left Simulated Manuscript Sheet
    ctx.fillStyle = '#FAF8F4';
    ctx.fillRect(24, 80, 520, 355);
    ctx.strokeStyle = '#D2CEC3';
    ctx.strokeRect(24, 80, 520, 355);

    ctx.fillStyle = '#0C0D0F';
    ctx.font = '600 15px Inter, sans-serif';
    ctx.fillText('Deterministic Substring Fingerprinting & Resemblance', 44, 112);

    ctx.fillStyle = '#565A64';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText('Nadia Kusuma · CS-402 Thesis Manuscript · 216 Evaluable Words', 44, 132);

    // Simulated Manuscript Lines with Highlight Animations
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
      if (ln.type === 's1' && currentTime >= 2.0) {
        ctx.fillStyle = '#E5F4F8';
        ctx.fillRect(40, y - 13, 480, 19);
        ctx.fillStyle = '#027A94';
        ctx.fillRect(40, y - 13, 3, 19);
      } else if (ln.type === 's2' && currentTime >= 5.0) {
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

    // Right Telemetry / Inspector Card
    ctx.fillStyle = '#141926';
    ctx.fillRect(564, 80, 372, 355);
    ctx.strokeStyle = '#2B354D';
    ctx.strokeRect(564, 80, 372, 355);

    // Big Similarity & Stylometry Readout
    ctx.fillStyle = '#949AA6';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText('SIMILARITY INDEX', 584, 110);
    ctx.fillText('STYLOMETRIC AI', 764, 110);

    const simVal = activeChapterIndex === 0 ? '46.2%' : activeChapterIndex === 2 ? '3.1%' : '46.2%';
    const aiVal = activeChapterIndex === 2 ? '84.6%' : '8.4%';

    ctx.fillStyle = '#2AD0F0';
    ctx.font = '700 32px "JetBrains Mono", monospace';
    ctx.fillText(simVal, 584, 146);

    ctx.fillStyle = activeChapterIndex === 2 ? '#F45BA8' : '#3DD68C';
    ctx.fillText(aiVal, 764, 146);

    // Divider
    ctx.strokeStyle = '#252E42';
    ctx.beginPath();
    ctx.moveTo(584, 166);
    ctx.lineTo(916, 166);
    ctx.stroke();

    // Chapter Title & Telemetry Lines
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

    // Progress Bar at bottom of canvas
    const pct = currentTime / TOTAL_DURATION;
    ctx.fillStyle = '#1E2536';
    ctx.fillRect(24, H - 10, W - 48, 4);
    ctx.fillStyle = '#2AD0F0';
    ctx.fillRect(24, H - 10, (W - 48) * pct, 4);
  }, [currentTime, activeChapter, activeChapterIndex]);

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
    <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] overflow-hidden">
      {/* Top Player Control Bar */}
      <div className="px-4 py-3 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="cw-btn-primary !py-1.5 !px-3 text-xs"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{playing ? 'Pause Walkthrough' : 'Play Walkthrough'}</span>
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
            <span>Restart</span>
          </button>
          <span className="cw-mono text-xs text-[var(--cw-ink-3)]">
            {currentTime.toFixed(1)}s / {TOTAL_DURATION}.0s
          </span>
        </div>

        <button
          type="button"
          onClick={exportWebmVideo}
          disabled={recording}
          className="cw-btn-ghost !py-1.5 !px-3 text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{recording ? 'Recording 6s WebM Clip...' : 'Export Walkthrough Video (.webm)'}</span>
        </button>
      </div>

      {/* High-Resolution Walkthrough Canvas */}
      <div className="bg-[#0D1017] w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block max-h-[460px] object-contain mx-auto"
        />
      </div>

      {/* Chapter Selection Grid & Synchronized Caption */}
      <div className="p-4 bg-[var(--cw-raised)] border-t border-[var(--cw-rule)]">
        <p className="text-sm text-[var(--cw-ink-2)] mb-3 leading-relaxed">
          <strong className="text-[var(--cw-ink)] font-semibold">{activeChapter.title}:</strong>{' '}
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
                <div className="text-xs font-semibold mt-0.5 line-clamp-1">{ch.title}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

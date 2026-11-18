'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FolioBlock {
  gx: number;
  gy: number;
  gz: number;
  homeX: number;
  homeY: number;
  homeZ: number;
  role: 'corpus' | 'stylo' | 'attest' | 'clean';
  hashHex: string;
  phaseOffset: number;
}

const PHASES = [
  {
    id: 'ingest',
    code: 'STAGE 01 · INGEST & TOKENIZE',
    label: 'Canonical k-gram normalization (k=15, w=10)',
    range: [0, 3.5],
  },
  {
    id: 'winnow',
    code: 'STAGE 02 · WINNOWING + MINHASH',
    label: 'Rightmost minimum hash selection & shingle alignment',
    range: [3.5, 8.0],
  },
  {
    id: 'stylo',
    code: 'STAGE 03 · QUOTE & STYLOMETRY',
    label: 'Excluding quoted intervals & scoring sentence burstiness',
    range: [8.0, 12.2],
  },
  {
    id: 'seal',
    code: 'STAGE 04 · SOLANA DEVNET SEAL',
    label: 'Anchoring SHA-256 digest via SPL Memo program',
    range: [12.2, 16.0],
  },
];

export function ManuscriptPrismCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [activePhaseIdx, setActivePhaseIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [manualTime, setManualTime] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate deterministic 4x4x4 = 64 folio blocks
    const blocks: FolioBlock[] = [];
    let idx = 0;
    for (let y = -1.5; y <= 1.5; y += 1) {
      for (let z = -1.5; z <= 1.5; z += 1) {
        for (let x = -1.5; x <= 1.5; x += 1) {
          const seed = Math.abs(Math.sin((idx + 1) * 12.9898) * 43758.5453) % 1;
          const role: FolioBlock['role'] =
            seed < 0.24
              ? 'corpus'
              : seed < 0.38
              ? 'stylo'
              : seed < 0.54
              ? 'attest'
              : 'clean';
          blocks.push({
            gx: x,
            gy: y,
            gz: z,
            homeX: x * 34,
            homeY: y * 24,
            homeZ: z * 34,
            role,
            hashHex: Math.floor(seed * 0xffffff)
              .toString(16)
              .padStart(6, '0'),
            phaseOffset: seed * 1.8,
          });
          idx++;
        }
      }
    }

    let onScreen = true;
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMqChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    mq.addEventListener('change', onMqChange);

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(wrap);

    let rafId = 0;
    const startClock = performance.now();

    const drawIsoCube = (
      cx: number,
      cy: number,
      size: number,
      height: number,
      topColor: string,
      leftColor: string,
      rightColor: string,
      strokeColor: string,
      alpha: number
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const w = size;
      const h = size * 0.55;

      // Top face
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + w, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx - w, cy);
      ctx.closePath();
      ctx.fillStyle = topColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.85;
      ctx.stroke();

      // Left face
      ctx.beginPath();
      ctx.moveTo(cx - w, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx, cy + h + height);
      ctx.lineTo(cx - w, cy + height);
      ctx.closePath();
      ctx.fillStyle = leftColor;
      ctx.fill();
      ctx.stroke();

      // Right face
      ctx.beginPath();
      ctx.moveTo(cx + w, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx, cy + h + height);
      ctx.lineTo(cx + w, cy + height);
      ctx.closePath();
      ctx.fillStyle = rightColor;
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    const renderFrame = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
          canvas.width = Math.round(rect.width * dpr);
          canvas.height = Math.round(rect.height * dpr);
        }
      }

      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const isDark =
        document.documentElement.dataset.theme === 'dark' ||
        (!document.documentElement.dataset.theme &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      // Loop time (16 seconds cycle)
      const elapsedSec =
        manualTime !== null
          ? manualTime
          : reducedMotion || paused
          ? 5.6
          : ((now - startClock) / 1000) % 16;

      const pIdx = PHASES.findIndex(
        (p) => elapsedSec >= p.range[0] && elapsedSec < p.range[1]
      );
      setActivePhaseIdx(pIdx >= 0 ? pIdx : 0);

      // Subtle architectural calibration grid
      const centerX = width * 0.5;
      const centerY = height * 0.52;
      ctx.strokeStyle = isDark ? 'rgba(148, 154, 166, 0.12)' : 'rgba(12, 13, 15, 0.07)';
      ctx.lineWidth = 1;
      for (let r = -120; r <= 120; r += 40) {
        ctx.beginPath();
        ctx.moveTo(centerX - 180, centerY + r * 0.5);
        ctx.lineTo(centerX + 180, centerY + r * 0.5);
        ctx.stroke();
      }

      // Slow orbital angle
      const angle = reducedMotion ? 0.62 : 0.55 + Math.sin(elapsedSec * 0.39) * 0.28;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Compute transformed block positions and painter's sort
      const projected = blocks.map((b) => {
        let dx = 0;
        let dy = 0;
        let dz = 0;
        let highlight = 0;

        // Stage 2 (3.5..8.0s): Winnowing separates corpus matches outward
        if (elapsedSec >= 3.5 && elapsedSec < 8.0) {
          const t = Math.min(1, (elapsedSec - 3.5) / 1.8);
          const ease = 1 - Math.pow(1 - t, 3);
          if (b.role === 'corpus') {
            dx = Math.sign(b.gx) * 22 * ease;
            dy = -14 * ease;
            highlight = ease;
          }
        }
        // Stage 3 (8.0..12.2s): Stylometry & Quote separation
        else if (elapsedSec >= 8.0 && elapsedSec < 12.2) {
          const t = Math.min(1, (elapsedSec - 8.0) / 1.6);
          const ease = 1 - Math.pow(1 - t, 3);
          if (b.role === 'stylo') {
            dz = Math.sign(b.gz) * 24 * ease;
            dy = -16 * ease;
            highlight = ease;
          } else if (b.role === 'attest') {
            dy = -10 * ease;
            highlight = ease;
          } else if (b.role === 'corpus') {
            dx = Math.sign(b.gx) * 14;
          }
        }
        // Stage 4 (12.2..16.0s): Solana SPL Memo compression & seal
        else if (elapsedSec >= 12.2) {
          const t = Math.min(1, (elapsedSec - 12.2) / 2.2);
          const compress = Math.sin(t * Math.PI) * 0.22;
          dx = -b.homeX * compress;
          dy = -b.homeY * compress;
          dz = -b.homeZ * compress;
          if (b.role === 'attest') highlight = 1;
        }

        const wx = b.homeX + dx;
        const wy = b.homeY + dy;
        const wz = b.homeZ + dz;

        const rx = wx * cosA - wz * sinA;
        const rz = wx * sinA + wz * cosA;

        const screenX = centerX + (rx - rz) * 0.86;
        const screenY = centerY + (rx + rz) * 0.44 + wy;
        const depth = rx + rz - wy * 0.5;

        return {
          b,
          screenX,
          screenY,
          depth,
          highlight,
        };
      });

      projected.sort((a, b) => a.depth - b.depth);

      for (const item of projected) {
        const { b, screenX, screenY, highlight } = item;
        let top = isDark ? '#232A3B' : '#EFECE4';
        let left = isDark ? '#1A202E' : '#E2DED3';
        let right = isDark ? '#141924' : '#D4CFC2';
        let stroke = isDark ? '#343E54' : '#C5BFB0';

        if (b.role === 'corpus') {
          top = '#2AD0F0';
          left = '#028DB0';
          right = '#045B70';
          stroke = isDark ? '#8EEBFF' : '#034454';
        } else if (b.role === 'stylo') {
          top = '#F45BA8';
          left = '#B5096F';
          right = '#7D064C';
          stroke = isDark ? '#FF9ED0' : '#5E0438';
        } else if (b.role === 'attest') {
          top = '#FFD25A';
          left = '#D49B00';
          right = '#9E6E00';
          stroke = isDark ? '#FFE699' : '#6B4A00';
        }

        const cubeW = 14 + highlight * 2.2;
        const cubeH = 10 + highlight * 2.5;
        drawIsoCube(screenX, screenY, cubeW, cubeH, top, left, right, stroke, 0.95);
      }

      // Scanning laser plane during Stage 1 & 2
      if (elapsedSec < 8.0) {
        const scanY = centerY - 75 + ((elapsedSec * 38) % 150);
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(42, 208, 240, 0.55)' : 'rgba(2, 122, 148, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX - 145, scanY);
        ctx.lineTo(centerX + 145, scanY);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      if (onScreen && !document.hidden && !reducedMotion && !paused && manualTime === null) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    const onVis = () => {
      if (!document.hidden && onScreen && !reducedMotion && !paused) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(renderFrame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      mq.removeEventListener('change', onMqChange);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [paused, manualTime]);

  const currentPhase = PHASES[activePhaseIdx] || PHASES[0];

  return (
    <div
      ref={wrapRef}
      className={`relative rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] overflow-hidden flex flex-col justify-between ${className}`}
      style={{ minHeight: 370 }}
    >
      {/* Top Telemetry Bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] text-xs">
        <div className="flex items-center gap-2">
          <span className="cw-pulse-dot" aria-hidden="true" />
          <span className="cw-mono font-semibold text-[var(--cw-ink)] tracking-wider">
            {currentPhase.code}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setManualTime(null);
              setPaused((p) => !p);
            }}
            className="cw-mono text-[11px] px-2 py-0.5 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] text-[var(--cw-ink-2)] hover:border-[var(--cw-signal)] cursor-pointer"
          >
            {paused ? 'Resume 3D Loop' : 'Pause 3D Loop'}
          </button>
        </div>
      </div>

      {/* Interactive 3D Canvas Viewport */}
      <div className="relative flex-1 w-full" style={{ height: 256 }}>
        <canvas
          ref={canvasRef}
          aria-label="3D Folio Prism visualizing Winnowing shingle inspection and Solana Devnet sealing"
          className="w-full h-full block"
        />
        {/* Legend Badges */}
        <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 bg-[var(--cw-paper)]/90 px-2.5 py-1 rounded-[4px] border border-[var(--cw-rule)] text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-[var(--cw-corpus-ink)] font-medium">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--cw-corpus)] inline-block" />
              Corpus Shingle
            </span>
            <span className="text-[var(--cw-rule-2)]">·</span>
            <span className="inline-flex items-center gap-1.5 text-[var(--cw-stylo-ink)] font-medium">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--cw-stylo)] inline-block" />
              Stylometric Drift
            </span>
            <span className="text-[var(--cw-rule-2)]">·</span>
            <span className="inline-flex items-center gap-1.5 text-[var(--cw-attest-ink)] font-medium">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--cw-attest)] inline-block" />
              Quote / SPL Seal
            </span>
          </div>
        </div>
      </div>

      {/* Phase Scrubber Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cw-rule)] bg-[var(--cw-sunken)]">
        <div className="text-xs text-[var(--cw-ink-2)] mb-2 flex items-center justify-between">
          <span>{currentPhase.label}</span>
          <span className="cw-mono text-[11px] text-[var(--cw-ink-3)]">64 Folios · w=10</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Inspection pipeline stages">
          {PHASES.map((p, i) => {
            const isActive = i === activePhaseIdx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPaused(true);
                  setManualTime(p.range[0] + 1.2);
                  setActivePhaseIdx(i);
                }}
                className={`text-left px-2 py-1 rounded-[4px] border text-[10px] cw-mono transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[var(--cw-signal)] bg-[var(--cw-signal-wash)] text-[var(--cw-signal-ink)] font-semibold'
                    : 'border-[var(--cw-rule)] bg-[var(--cw-raised)] text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                }`}
              >
                0{i + 1} · {p.id.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


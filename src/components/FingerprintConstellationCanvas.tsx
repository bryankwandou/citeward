'use client';

import React, { useEffect, useRef } from 'react';

interface FingerprintConstellationCanvasProps {
  mode: 'excluded' | 'raw';
  nodeCount?: number;
}

/**
 * Renders 1,024 deterministic animated Winnowing fingerprint nodes on a lightweight
 * 60fps HTML5 Canvas (zero React re-renders, respects prefers-reduced-motion).
 */
export function FingerprintConstellationCanvas({
  mode,
  nodeCount = 1024,
}: FingerprintConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let width = 0;
    let height = 0;
    const pointer = { x: -9999, y: -9999, active: false };

    const nodes = Array.from({ length: nodeCount }, (_, i) => {
      const seed = (i + 1) * 2654435761;
      const rx = ((seed >>> 0) % 10000) / 10000;
      const ry = (((seed * 31) >>> 0) % 10000) / 10000;
      const phase = (((seed * 17) >>> 0) % 6283) / 1000;
      const speed = 0.0005 + (((seed * 13) >>> 0) % 1000) / 850000;
      const radius = 0.9 + (((seed * 7) >>> 0) % 14) / 10;
      const channel = i % 4; // 0=corpus teal, 1=signal blue, 2=stylo magenta, 3=attest gold
      return { rx, ry, phase, speed, radius, channel };
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const draw = (ts: number) => {
      const isDark =
        document.documentElement.dataset.theme === 'dark' ||
        (!document.documentElement.dataset.theme &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      const palette = isDark
        ? ['rgba(42,208,240,', 'rgba(104,137,255,', 'rgba(244,91,168,', 'rgba(245,189,28,']
        : ['rgba(2,122,148,', 'rgba(25,57,183,', 'rgba(168,12,96,', 'rgba(158,110,0,'];

      ctx.clearRect(0, 0, width, height);

      const t = reducedMotion ? 0 : ts;
      const spreadBoost = modeRef.current === 'raw' ? 1.25 : 0.85;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const driftX = Math.sin(t * n.speed + n.phase) * 14 * spreadBoost;
        const driftY = Math.cos(t * n.speed * 0.9 + n.phase * 1.3) * 10 * spreadBoost;
        let x = n.rx * width + driftX;
        let y = n.ry * height + driftY;

        let alpha = isDark ? 0.28 : 0.22;
        if (pointer.active) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 12000 && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const push = (1 - dist / 110) * 12;
            x += (dx / dist) * push;
            y += (dy / dist) * push;
            alpha = isDark ? 0.65 : 0.52;
          }
        }

        const pulse = 0.72 + 0.28 * Math.sin(t * 0.002 + n.phase);
        ctx.fillStyle = `${palette[n.channel]}${(alpha * pulse).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(draw);
      }
    };

    rafId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [nodeCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-auto absolute inset-0 w-full h-full opacity-75"
    />
  );
}


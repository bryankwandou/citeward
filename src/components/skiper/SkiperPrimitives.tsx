'use client';

/**
 * Adapted Skiper-UI Motion Primitives for Citeward
 * ─────────────────────────────────────────────────────────────────────────────
 * Attribution & Adaptation Notes (per Design Handbook Bab 8.13):
 *   - skiper16 (Sticky Card Stack): Removed global Lenis smooth-scroll hijacking;
 *     collapses cleanly into a static vertical list under prefers-reduced-motion.
 *   - skiper40 (Directional Underline Sweep): Ported to pure CSS (.cw-link-sweep)
 *     for zero-JS reliability.
 *   - skiper41 (Progressive Edge Blur / Feather): Horizontal ticker with CSS
 *     mask-image feathering tuned to var(--cw-paper).
 *   - skiper61 (Spring Pointer Spotlight): Token-colored radial spotlight that
 *     follows fine pointers while preserving the native OS cursor.
 */

import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export function MagneticButtonWrap({
  children,
  strength = 0.2,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const x = useSpring(0, { stiffness: 160, damping: 16 });
  const y = useSpring(0, { stiffness: 160, damping: 16 });

  return (
    <motion.span
      style={{ x, y, display: 'inline-block' }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const r = e.currentTarget.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        x.set(Math.max(-9, Math.min(9, dx)));
        y.set(Math.max(-9, Math.min(9, dy)));
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

export function Skiper40Link({
  href,
  children,
  external = false,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`cw-link-sweep ${className}`}
    >
      <span>{children}</span>
      {external && (
        <span aria-hidden="true" className="text-[11px] leading-none">
          ↗
        </span>
      )}
    </a>
  );
}

export function Skiper61SpotlightSurface({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [coords, setCoords] = useState({ x: -400, y: -400 });
  const [active, setActive] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        if (!active) setActive(true);
      }}
      onPointerLeave={() => setActive(false)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(420px circle at ${coords.x}px ${coords.y}px, rgba(2, 122, 148, 0.075), transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export interface StackCardItem {
  step: string;
  title: string;
  formula: string;
  body: string;
  accent: 'corpus' | 'stylo' | 'attest';
}

export function Skiper16ArchitectureStack({ items }: { items: StackCardItem[] }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const badgeStyles =
          item.accent === 'corpus'
            ? 'bg-[var(--cw-corpus-wash)] text-[var(--cw-corpus-ink)] border-[var(--cw-corpus-rule)]'
            : item.accent === 'stylo'
            ? 'bg-[var(--cw-stylo-wash)] text-[var(--cw-stylo-ink)] border-[var(--cw-stylo-rule)]'
            : 'bg-[var(--cw-attest-wash)] text-[var(--cw-attest-ink)] border-[var(--cw-attest-rule)]';

        return (
          <article
            key={item.step}
            style={
              reduced
                ? undefined
                : {
                    position: 'sticky',
                    top: `${92 + idx * 18}px`,
                  }
            }
            className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-5 shadow-[var(--cw-e2)] transition-transform duration-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <span className={`cw-mono text-xs font-semibold px-2.5 py-0.5 rounded-[4px] border ${badgeStyles}`}>
                {item.step}
              </span>
              <code className="cw-mono text-xs px-2.5 py-1 rounded-[4px] bg-[var(--cw-sunken)] text-[var(--cw-ink-2)] border border-[var(--cw-rule)]">
                {item.formula}
              </code>
            </div>
            <h3 className="cw-h3 mb-1.5">{item.title}</h3>
            <p className="text-sm text-[var(--cw-ink-2)] leading-relaxed">{item.body}</p>
          </article>
        );
      })}
    </div>
  );
}

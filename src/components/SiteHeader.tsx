'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { CitewardLogo } from './logo';
import { DICTIONARIES, LocaleCode, useI18n } from '@/lib/i18n';

type ThemeMode = 'system' | 'light' | 'dark';

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    restDelta: 0.001,
  });

  const [theme, setTheme] = useState<ThemeMode>('system');
  const [devnetInfo, setDevnetInfo] = useState<{
    address: string | null;
    balanceSol: number;
  }>({ address: 'AUo5...5AG7', balanceSol: 788.27 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('citeward_theme') as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        document.documentElement.dataset.theme = saved;
      }
    } catch {}

    fetch('/api/solana')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d?.status?.address) {
          setDevnetInfo({
            address: d.status.address,
            balanceSol: d.status.balanceSol,
          });
        }
      })
      .catch(() => {});
  }, []);

  const applyTheme = (next: ThemeMode) => {
    setTheme(next);
    const root = document.documentElement;
    try {
      if (next === 'system') {
        delete root.dataset.theme;
        localStorage.removeItem('citeward_theme');
      } else {
        root.dataset.theme = next;
        localStorage.setItem('citeward_theme', next);
      }
    } catch {}
  };

  const navItems = [
    { href: '/#studio', label: t.nav.studio, match: '/#studio' },
    { href: '/#dial', label: t.nav.dial, match: '/#dial' },
    { href: '/#paraphrase', label: t.nav.paraphrase, match: '/#paraphrase' },
    { href: '/#beats', label: t.nav.beats, match: '/#beats' },
    { href: '/#ecosystem', label: t.nav.ecosystem, match: '/#ecosystem' },
    { href: '/matrix', label: t.nav.matrix, match: '/matrix' },
    { href: '/verify', label: t.nav.verify, match: '/verify' },
    { href: '/deck', label: t.nav.deck, match: '/deck' },
  ];

  const shortAddr = devnetInfo.address
    ? `${devnetInfo.address.slice(0, 4)}…${devnetInfo.address.slice(-4)}`
    : 'Devnet';

  return (
    <>
      {!reduce && (
        <motion.div
          className="cw-progress"
          style={{ scaleX }}
          aria-hidden="true"
        />
      )}
      <div className="cw-rails" aria-hidden="true" />

      <header
        className="sticky top-0 border-b border-[var(--cw-rule)] bg-[var(--cw-paper)]/92 backdrop-blur-md"
        style={{ zIndex: 'var(--z-sticky)' }}
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="focus:outline-none shrink-0">
              <CitewardLogo size={32} subtitle="Open Similarity & Notary" />
            </Link>

            <nav
              aria-label="Primary navigation"
              className="hidden xl:flex items-center gap-0.5"
            >
              {navItems.map((item) => {
                const active =
                  item.match.startsWith('/#')
                    ? false
                    : pathname?.startsWith(item.match);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2.5 py-1.5 rounded-[5px] text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[var(--cw-sunken)] text-[var(--cw-ink)] border border-[var(--cw-rule-2)]'
                        : 'text-[var(--cw-ink-2)] hover:text-[var(--cw-ink)] hover:bg-[var(--cw-sunken)]/60'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Solana Devnet Notary Pill */}
            <Link
              href="/verify"
              title={
                devnetInfo.address
                  ? `Solana Devnet Notary Issuer: ${devnetInfo.address}`
                  : 'Solana Devnet Notary'
              }
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] text-[11px] cw-mono text-[var(--cw-ink-2)] hover:border-[var(--cw-signal)]"
            >
              <span className="cw-pulse-dot" aria-hidden="true" />
              <span>{shortAddr}</span>
              <span className="text-[var(--cw-rule-2)]">·</span>
              <span className="font-semibold text-[var(--cw-ink)]">
                {devnetInfo.balanceSol.toFixed(1)} SOL
              </span>
            </Link>

            {/* 8-Language Selector */}
            <label htmlFor="cw-locale-select" className="sr-only">
              Select interface language
            </label>
            <select
              id="cw-locale-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocaleCode)}
              aria-label="Interface language"
              className="cw-mono text-xs px-2 py-1 rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] text-[var(--cw-ink)] font-semibold cursor-pointer"
            >
              {(Object.keys(DICTIONARIES) as LocaleCode[]).map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()} · {DICTIONARIES[code].localeLabel}
                </option>
              ))}
            </select>

            {/* 3-State Theme Segmented Control (System / Light / Dark) */}
            <div
              role="radiogroup"
              aria-label="Color theme mode"
              className="hidden md:inline-flex items-center rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-0.5"
            >
              {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={theme === m}
                  onClick={() => applyTheme(m)}
                  className={`cw-mono text-[11px] capitalize px-2 py-1 rounded-[3px] transition-colors cursor-pointer ${
                    theme === m
                      ? 'bg-[var(--cw-ink)] text-[var(--cw-paper)] font-semibold'
                      : 'text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                  }`}
                >
                  {m === 'system' ? 'Auto' : m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Navigation Strip for Tablet/Mobile */}
        <div className="flex xl:hidden items-center gap-1 px-4 py-1.5 border-t border-[var(--cw-rule)] bg-[var(--cw-sunken)] overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-2.5 py-1 rounded-[4px] text-xs font-medium whitespace-nowrap text-[var(--cw-ink-2)] hover:bg-[var(--cw-raised)] hover:text-[var(--cw-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
    </>
  );
}

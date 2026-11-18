'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CitewardLogo } from './logo';
import { DICTIONARIES, LocaleCode, useI18n } from '@/lib/i18n';

type ThemeMode = 'system' | 'light' | 'dark';

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale } = useI18n();

  const [theme, setTheme] = useState<ThemeMode>('system');
  const [devnetInfo, setDevnetInfo] = useState<{
    address: string | null;
    balanceSol: number;
  }>({ address: '8mKrzbpj7TZwcSXjnuAbKnE5y8cQ6SL9YNzf1U6tvHQY', balanceSol: 12.5 });

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
    { href: '/', label: 'Landing Page', exact: true },
    { href: '/studio', label: 'Turnitin Studio', exact: false },
    { href: '/#paraphrase', label: 'Anti-AI Paraphrase', exact: false },
    { href: '/matrix', label: 'Cohort Matrix', exact: false },
    { href: '/verify', label: 'Verify Receipt', exact: false },
  ];

  const shortAddr = devnetInfo.address
    ? `${devnetInfo.address.slice(0, 4)}…${devnetInfo.address.slice(-4)}`
    : 'Devnet';

  return (
    <header
      className="sticky top-0 border-b border-[var(--cw-rule-2)] bg-[var(--cw-raised)]/95 backdrop-blur-md"
      style={{ zIndex: 'var(--z-sticky)' }}
    >
      <div className="max-w-[1420px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/" className="focus:outline-none shrink-0">
            <CitewardLogo size={28} subtitle="Turnitin-Calibrated Studio" />
          </Link>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === '/'
                : !item.href.startsWith('/#') && pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-[5px] text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[var(--cw-signal)] text-white'
                      : 'text-[var(--cw-ink-2)] hover:text-[var(--cw-ink)] hover:bg-[var(--cw-sunken)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pathname !== '/studio' && (
            <Link href="/studio" className="cw-btn-primary !py-1.5 !px-3.5 text-xs">
              <span>Open Turnitin Studio</span>
            </Link>
          )}

          <Link
            href="/verify"
            title={
              devnetInfo.address
                ? `Citeward Devnet Notary: ${devnetInfo.address}`
                : 'Solana Devnet Notary'
            }
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] text-[11px] cw-mono text-[var(--cw-ink-2)] hover:border-[var(--cw-signal)]"
          >
            <span className="cw-pulse-dot" aria-hidden="true" />
            <span>{shortAddr}</span>
            <span className="text-[var(--cw-rule-2)]">·</span>
            <span className="font-semibold text-[var(--cw-ink)]">
              {devnetInfo.balanceSol.toFixed(1)} SOL
            </span>
          </Link>

          <label htmlFor="cw-locale-select" className="sr-only">
            Select interface language
          </label>
          <select
            id="cw-locale-select"
            value={locale}
            onChange={(e) => setLocale(e.target.value as LocaleCode)}
            aria-label="Interface language"
            className="cw-mono text-xs px-2 py-1 rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-[var(--cw-ink)] font-semibold cursor-pointer"
          >
            {(Object.keys(DICTIONARIES) as LocaleCode[]).map((code) => (
              <option key={code} value={code}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>

          <div
            role="radiogroup"
            aria-label="Color theme mode"
            className="hidden sm:inline-flex items-center rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] p-0.5"
          >
            {(['light', 'dark'] as ThemeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={theme === m}
                onClick={() => applyTheme(m)}
                className={`cw-mono text-[11px] capitalize px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
                  theme === m
                    ? 'bg-[var(--cw-ink)] text-[var(--cw-paper)] font-semibold'
                    : 'text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

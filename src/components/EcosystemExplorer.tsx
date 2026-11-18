'use client';

import React, { useMemo, useState } from 'react';
import { Search, ExternalLink, GitBranch } from 'lucide-react';
import {
  OPEN_SOURCE_ECOSYSTEM_REGISTRY,
  OpenSourceToolEntry,
} from '@/lib/forensics-and-ecosystem';

const CATEGORIES: Array<'All' | OpenSourceToolEntry['category']> = [
  'All',
  'Fingerprinting & AST',
  'MinHash & LSH Indexing',
  'Stylometry & AI Detection',
  'Scholarly Corpus APIs',
  'NLP & Tokenization',
  'Document OCR & Parsing',
  'Cryptographic Attestation',
];

export function EcosystemExplorer() {
  const [search, setSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'All' | OpenSourceToolEntry['category']>('All');

  const filtered = useMemo(() => {
    return OPEN_SOURCE_ECOSYSTEM_REGISTRY.filter((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.algorithm.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.integrationStatus.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  return (
    <section
      id="ecosystem"
      className="py-14 border-t border-[var(--cw-rule)] bg-[var(--cw-sunken)]"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <div className="cw-kicker mb-2 flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-[var(--cw-corpus)]" />
              <span>§ 06 — OPEN-SOURCE ECOSYSTEM &amp; 1,040+ REPOSITORY SYNTHESIS</span>
            </div>
            <h2 className="cw-h1">
              Synthesized from peer-reviewed repositories and open scholarly indices.
            </h2>
          </div>
          <p className="lg:col-span-5 text-sm text-[var(--cw-ink-2)] leading-relaxed">
            Citeward unifies deterministic fingerprinting (MOSS, JPlag), locality-sensitive
            shingle hashing (Datasketch, SimHash), statistical stylometry (GLTR, DetectGPT,
            Binoculars, LexicalRichness), and open scholarly APIs (OpenAlex, Crossref,
            S2ORC, MediaWiki) in a single browser-native studio.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-4 space-y-3 shadow-[var(--cw-e1)]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--cw-ink-3)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories, algorithms (e.g., Winnowing, MinHash, GLTR, OpenAlex, Homoglyph)..."
                aria-label="Search open-source ecosystem registry"
                className="w-full pl-10 pr-4 py-2 rounded-[6px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-xs text-[var(--cw-ink)]"
              />
            </div>
            <div className="cw-mono text-xs text-[var(--cw-ink-3)] shrink-0">
              Showing {filtered.length} core reference implementations (of 1,040+ cataloged
              OSS modules)
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`cw-mono text-[11px] px-2.5 py-1 rounded-[5px] border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--cw-signal)] text-white border-[var(--cw-signal)] font-semibold'
                      : 'bg-[var(--cw-sunken)] text-[var(--cw-ink-2)] border-[var(--cw-rule)] hover:border-[var(--cw-ink-3)]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Registry Table */}
        <div className="overflow-x-auto rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e1)]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] cw-mono text-xs uppercase text-[var(--cw-ink-3)]">
                <th scope="col" className="p-3.5">
                  Repository / Standard
                </th>
                <th scope="col" className="p-3.5">
                  Category
                </th>
                <th scope="col" className="p-3.5">
                  Algorithmic Primitive
                </th>
                <th scope="col" className="p-3.5">
                  Citeward Implementation
                </th>
                <th scope="col" className="p-3.5 text-right">
                  Adoption / License
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cw-rule)]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--cw-sunken)]/50">
                  <th scope="row" className="p-3.5 font-semibold text-[var(--cw-ink)]">
                    <a
                      href={item.repoOrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[var(--cw-signal-ink)] hover:underline"
                    >
                      <span>{item.name}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </th>
                  <td className="p-3.5">
                    <span className="cw-mono text-[11px] px-2 py-0.5 rounded bg-[var(--cw-sunken)] border border-[var(--cw-rule)] text-[var(--cw-ink-2)]">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-[var(--cw-ink-2)]">{item.algorithm}</td>
                  <td className="p-3.5 cw-mono text-xs text-[var(--cw-corpus-ink)]">
                    {item.integrationStatus}
                  </td>
                  <td className="p-3.5 text-right cw-mono text-xs text-[var(--cw-ink-3)] whitespace-nowrap">
                    {item.stars} · {item.license}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


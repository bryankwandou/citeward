'use client';

import React from 'react';

interface BeatCard {
  id: string;
  num: string;
  kicker: string;
  title: string;
  body: string;
  trigger: string;
  visualType:
  | 'rabin_karp'
  | 'winnow_min'
  | 'minhash_lsh'
  | 'homoglyph'
  | 'burstiness'
  | 'mattr'
  | 'quote_gate'
  | 'openalex'
  | 'solana_seal';
}

const BEATS: BeatCard[] = [
  {
    id: 'b1',
    num: '01',
    kicker: 'ROLLING POLYNOMIAL HASH',
    title: 'Rabin-Karp k-Gram Stream',
    body: 'Slides a 15-character window across normalized Unicode text in O(N) time using base-31 modular arithmetic.',
    trigger: 'trigger: every 15-char normalized substring',
    visualType: 'rabin_karp',
  },
  {
    id: 'b2',
    num: '02',
    kicker: 'SCHLEIMER ET AL. (SIGMOD 2003)',
    title: 'Rightmost-Minimum Winnowing',
    body: 'Selects the smallest hash inside each w=10 window, guaranteeing capture of any contiguous match >= 24 characters.',
    trigger: 'trigger: local minimum in window w=10',
    visualType: 'winnow_min',
  },
  {
    id: 'b3',
    num: '03',
    kicker: 'BRODER (IEEE SEQUENCES 1997)',
    title: '64-Permutation MinHash LSH',
    body: 'Compresses 3-word shingle sets into fixed 256-byte signatures to estimate Jaccard containment in microseconds.',
    trigger: 'trigger: 3-word overlapping shingle set',
    visualType: 'minhash_lsh',
  },
  {
    id: 'b4',
    num: '04',
    kicker: 'UNICODE TR39 CONFUSABLES',
    title: 'Homoglyph & Zero-Width Trap',
    body: 'Exposes Cyrillic and Greek lookalike letters (а, е, о) and invisible U+200B splitters before hashing.',
    trigger: 'trigger: non-Latin script inside Latin word',
    visualType: 'homoglyph',
  },
  {
    id: 'b5',
    num: '05',
    kicker: 'CADENCE VARIATION (SIGMA / MU)',
    title: 'Sentence Burstiness Wave',
    body: 'Measures clause-length dispersion. Human empirical prose fluctuates wildly; synthetic prose flatlines around 18 words.',
    trigger: 'trigger: CV = stdDev(L) / mean(L)',
    visualType: 'burstiness',
  },
  {
    id: 'b6',
    num: '06',
    kicker: 'SLIDING LEXICAL DIVERSITY',
    title: 'MATTR-50 Moving Window',
    body: 'Computes Type-Token Ratio across a 50-word moving window so document length never biases vocabulary richness.',
    trigger: 'trigger: 50-word sliding token window',
    visualType: 'mattr',
  },
  {
    id: 'b7',
    num: '07',
    kicker: 'TURNITIN DENOMINATOR PARITY',
    title: 'Quote & Bibliography Gate',
    body: 'Isolates enclosed quotations and trailing reference lists so toggling exclusions updates the exact word denominator.',
    trigger: 'trigger: "..." or References heading',
    visualType: 'quote_gate',
  },
  {
    id: 'b8',
    num: '08',
    kicker: '250M+ OPENALEX & CROSSREF',
    title: 'Inverted-Index Reconstructor',
    body: 'Reassembles OpenAlex position-mapped abstracts on the fly and aligns them against student shingles.',
    trigger: 'trigger: live API keyphrase query',
    visualType: 'openalex',
  },
  {
    id: 'b9',
    num: '09',
    kicker: 'SPL MEMO DEVNET NOTARY',
    title: 'SHA-256 Prior-Art Seal',
    body: 'Writes a compact Ed25519-signed SHA-256 commitment onto Solana Devnet without exposing a single word of plaintext.',
    trigger: 'trigger: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
    visualType: 'solana_seal',
  },
];

export function NineBeatsGallery() {
  return (
    <section id="beats" className="py-14 border-t border-[var(--cw-rule)] bg-[var(--cw-paper)]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-8">
          <div className="lg:col-span-7">
            <div className="cw-kicker mb-2">§ 05 — NINE FORENSIC PRIMITIVES IN MOTION</div>
            <h2 className="cw-h1">Nine mathematical gates behind every inspection.</h2>
          </div>
          <p className="lg:col-span-5 text-sm text-[var(--cw-ink-2)] leading-relaxed">
            Each card below runs a live micro-visualization of the exact algorithm used in
            Citeward&rsquo;s engine. Hover or focus any stage card to inspect its trigger
            and telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BEATS.map((b) => (
            <article
              key={b.id}
              className="group rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] overflow-hidden shadow-[var(--cw-e1)] hover:shadow-[var(--cw-e3)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              {/* Animated Dark Stage */}
              <div className="h-40 bg-[#0E121B] border-b border-[var(--cw-rule)] p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between cw-mono text-[10px] text-[#949AA6]">
                  <span>GATE {b.num}</span>
                  <span className="text-[#2AD0F0]">{b.kicker}</span>
                </div>

                {/* Stage Specific Micro-Animation */}
                <div className="my-auto">
                  {b.visualType === 'rabin_karp' && (
                    <div className="space-y-1.5 cw-mono text-xs">
                      <div className="text-[#E8EDF5] tracking-wider">
                        winnow<span className="bg-[#028DB0] text-white px-1 rounded">ing_algorit</span>hm
                      </div>
                      <div className="text-[11px] text-[#2AD0F0]">
                        H = (H &times; 31 + c) mod 2<sup>31</sup>-1 &rarr; 0x4F8A21
                      </div>
                    </div>
                  )}

                  {b.visualType === 'winnow_min' && (
                    <div className="grid grid-cols-5 gap-1.5 cw-mono text-[11px] text-center">
                      {['0x8A2', '0x4C1', '0x19F', '0x7B0', '0x3E4'].map((h, i) => (
                        <div
                          key={h}
                          className={`py-1.5 rounded border ${i === 2
                            ? 'bg-[#028DB0] text-white border-[#2AD0F0] font-bold scale-105'
                            : 'bg-[#161C2A] text-[#949AA6] border-[#263044]'
                            }`}
                        >
                          {h}
                        </div>
                      ))}
                    </div>
                  )}

                  {b.visualType === 'minhash_lsh' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 cw-mono text-[11px] text-[#E8EDF5]">
                        <span className="w-16 text-[#949AA6]">Sig A:</span>
                        <div className="h-3 bg-[#028DB0] rounded w-4/5" />
                      </div>
                      <div className="flex items-center gap-2 cw-mono text-[11px] text-[#E8EDF5]">
                        <span className="w-16 text-[#949AA6]">Sig B:</span>
                        <div className="h-3 bg-[#2AD0F0] rounded w-3/5" />
                      </div>
                      <div className="cw-mono text-[10px] text-[#3DD68C]">
                        J(A,B) = |h_min(A) == h_min(B)| / 64 = 78.1%
                      </div>
                    </div>
                  )}

                  {b.visualType === 'homoglyph' && (
                    <div className="cw-mono text-sm text-[#E8EDF5] flex items-center justify-center gap-1">
                      <span>p</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#B3261E] text-white font-bold">
                        а (U+0430)
                      </span>
                      <span>ger &rarr; normalized &lsquo;a&rsquo;</span>
                    </div>
                  )}

                  {b.visualType === 'burstiness' && (
                    <div className="flex items-end gap-1.5 h-14 px-2">
                      {[18, 42, 12, 50, 22, 48, 14, 38, 52, 16].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}px` }}
                          className="flex-1 rounded-t bg-[#3DD68C] transition-all group-hover:bg-[#2AD0F0]"
                        />
                      ))}
                    </div>
                  )}

                  {b.visualType === 'mattr' && (
                    <div className="p-2 rounded bg-[#161C2A] border border-[#263044] cw-mono text-xs flex items-center justify-between">
                      <span className="text-[#949AA6]">Window [w_1..w_50]</span>
                      <span className="text-[#FFD25A] font-bold">MATTR = 0.814</span>
                    </div>
                  )}

                  {b.visualType === 'quote_gate' && (
                    <div className="flex items-center justify-center gap-2 cw-mono text-xs">
                      <span className="px-2 py-1 rounded bg-[#2E2206] text-[#FFD25A] border border-[#5E460D]">
                        &ldquo;Quoted Span&rdquo;
                      </span>
                      <span className="text-[#3DD68C] font-bold">&rarr; EXCLUDED</span>
                    </div>
                  )}

                  {b.visualType === 'openalex' && (
                    <div className="cw-mono text-[11px] text-[#E8EDF5] space-y-1">
                      <div className="text-[#949AA6]">
                        {`{"winnowing": [0, 14], "hashes": [5]}`}
                      </div>
                      <div className="text-[#2AD0F0]">
                        &rarr; Reconstructed 240w Abstract
                      </div>
                    </div>
                  )}

                  {b.visualType === 'solana_seal' && (
                    <div className="p-2 rounded bg-[#162044] border border-[#2B3F82] cw-mono text-[11px] text-[#8FA8FF] truncate">
                      tx: 26yrD358WWGpB2xfiZ6Xj5...PtnA
                    </div>
                  )}
                </div>

                <div className="cw-mono text-[10px] text-[#7E8491] truncate">
                  {b.trigger}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="cw-h3 text-base mb-1.5">{b.title}</h3>
                  <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">{b.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


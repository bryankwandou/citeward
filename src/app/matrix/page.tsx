'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import {
  computeMinHashSignature,
  computeWinnowFingerprints,
  estimateMinHashJaccard,
  tokenizeManuscript,
} from '@/lib/similarity-engine';

interface CohortDoc {
  id: string;
  title: string;
  student: string;
  text: string;
}

const INITIAL_COHORT: CohortDoc[] = [
  {
    id: 'doc-a',
    title: 'Submission A · Rabin-Karp Rolling Hash Complexity',
    student: 'Student 1042',
    text: `Digital documents are easily copied and modified, making accurate detection of partial copies essential for academic integrity. The winnowing algorithm slides a window of size w across the sequence of k-gram hashes and selects the minimum hash value within each window, breaking ties by choosing the rightmost occurrence. In our benchmark across 5,000 student essays, rolling polynomial hashes reduced memory overhead by 62 percent compared to full suffix trees.`,
  },
  {
    id: 'doc-b',
    title: 'Submission B · Windowed Fingerprint Density Study',
    student: 'Student 1089',
    text: `Because digital documents are easily copied and modified, accurate detection of partial copies remains essential for academic integrity. In our implementation, the winnowing algorithm slides a window of size w across the sequence of k-gram hashes and selects the minimum hash value within each window, breaking ties by choosing the rightmost occurrence. We evaluated this guarantee on regional thesis archives.`,
  },
  {
    id: 'doc-c',
    title: 'Submission C · Shingle Resemblance & MinHash LSH',
    student: 'Student 1104',
    text: `To evaluate the syntactic resemblance of two documents without performing quadratic pairwise character comparisons, each document is mapped into a canonical set of contiguous token subsequences known as k-shingles. The resemblance of two documents is defined as the Jaccard intersection over union of their respective shingle sets.`,
  },
  {
    id: 'doc-d',
    title: 'Submission D · Estuarine Mangrove Peat Carbon Cores',
    student: 'Student 1158',
    text: `We cored eighteen sediment profiles across three tidal creeks in the northern Mahakam Delta between July and September. Core barrels hit dense fibrous rhizome mats at 85 cm in the seaward Avicennia zone, whereas interior Nypa stands yielded unconsolidated silt down to 240 cm.`,
  },
];

export default function MatrixPage() {
  const [docs, setDocs] = useState<CohortDoc[]>(INITIAL_COHORT);
  const [selectedPair, setSelectedPair] = useState<[number, number]>([0, 1]);
  const [newTitle, setNewTitle] = useState('');
  const [newStudent, setNewStudent] = useState('');
  const [newText, setNewText] = useState('');

  const analysis = useMemo(() => {
    const processed = docs.map((d) => {
      const tokens = tokenizeManuscript(d.text);
      const winnow = computeWinnowFingerprints(d.text);
      const minhash = computeMinHashSignature(tokens);
      const shingleSet = new Set<string>();
      for (let i = 0; i <= tokens.length - 3; i++) {
        shingleSet.add(`${tokens[i].word} ${tokens[i + 1].word} ${tokens[i + 2].word}`);
      }
      return { doc: d, tokens, winnow, minhash, shingleSet };
    });

    const matrix: Array<
      Array<{
        shingleOverlapPct: number;
        minHashPct: number;
        sharedWinnowHashes: number;
        sharedShingles: string[];
      }>
    > = [];

    for (let i = 0; i < processed.length; i++) {
      const row = [];
      for (let j = 0; j < processed.length; j++) {
        if (i === j) {
          row.push({
            shingleOverlapPct: 100,
            minHashPct: 100,
            sharedWinnowHashes: processed[i].winnow.length,
            sharedShingles: [],
          });
          continue;
        }
        const a = processed[i];
        const b = processed[j];
        const sharedShingles: string[] = [];
        for (const sh of a.shingleSet) {
          if (b.shingleSet.has(sh)) sharedShingles.push(sh);
        }
        const denom = Math.max(1, Math.min(a.shingleSet.size, b.shingleSet.size));
        const shingleOverlapPct = Number(
          ((sharedShingles.length / denom) * 100).toFixed(1)
        );
        const minHashPct = Number(
          (estimateMinHashJaccard(a.minhash, b.minhash) * 100).toFixed(1)
        );
        const bHashes = new Set(b.winnow.map((w) => w.hash));
        const sharedWinnowHashes = a.winnow.filter((w) => bHashes.has(w.hash)).length;

        row.push({
          shingleOverlapPct,
          minHashPct,
          sharedWinnowHashes,
          sharedShingles,
        });
      }
      matrix.push(row);
    }

    return { processed, matrix };
  }, [docs]);

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setDocs((prev) => [
      ...prev,
      {
        id: `doc-${Date.now()}`,
        title: newTitle.trim() || `Submission ${String.fromCharCode(65 + prev.length)}`,
        student: newStudent.trim() || `Student ${1200 + prev.length}`,
        text: newText.trim(),
      },
    ]);
    setNewTitle('');
    setNewStudent('');
    setNewText('');
  };

  const [idxA, idxB] = selectedPair;
  const pairCell =
    analysis.matrix[idxA]?.[idxB] || {
      shingleOverlapPct: 0,
      minHashPct: 0,
      sharedWinnowHashes: 0,
      sharedShingles: [],
    };
  const docA = docs[idxA];
  const docB = docs[idxB];

  return (
    <div className="py-12 max-w-[1380px] mx-auto px-4 sm:px-6 space-y-10">
      <div>
        <div className="cw-kicker mb-2 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[var(--cw-corpus)]" />
          <span>COHORT COLLUSION &amp; PAIRWISE RESEMBLANCE MATRIX</span>
        </div>
        <h1 className="cw-h1">Cross-Document Winnowing &amp; MinHash Matrix</h1>
        <p className="cw-lead mt-2">
          Compare multiple student submissions or draft revisions simultaneously using
          pairwise 3-gram shingle containment and Schleimer Winnowing fingerprint
          intersection. Click any cell in the matrix to inspect shared spans side by side.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] overflow-x-auto">
            <div className="px-4 py-3 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex items-center justify-between">
              <span className="cw-mono text-xs font-semibold uppercase text-[var(--cw-ink-2)]">
                Pairwise Containment Matrix ({docs.length} &times; {docs.length} Documents)
              </span>
              <span className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
                Click any cell to inspect pair
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--cw-rule)] bg-[var(--cw-paper)] cw-mono text-[var(--cw-ink-3)]">
                  <th scope="col" className="p-3">
                    Submission
                  </th>
                  {docs.map((d, j) => (
                    <th key={d.id} scope="col" className="p-3 text-center">
                      Doc {String.fromCharCode(65 + j)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cw-rule)]">
                {docs.map((rowDoc, i) => (
                  <tr key={rowDoc.id}>
                    <th
                      scope="row"
                      className="p-3 font-semibold text-[var(--cw-ink)] whitespace-nowrap"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          Doc {String.fromCharCode(65 + i)} · {rowDoc.student}
                        </span>
                        {docs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setDocs((prev) => prev.filter((_, idx) => idx !== i));
                              setSelectedPair([0, 1]);
                            }}
                            className="text-[var(--cw-ink-4)] hover:text-[var(--cw-bad)] cursor-pointer"
                            title="Remove document from cohort"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </th>
                    {docs.map((colDoc, j) => {
                      const cell = analysis.matrix[i]?.[j];
                      const isDiag = i === j;
                      const isSelected =
                        (selectedPair[0] === i && selectedPair[1] === j) ||
                        (selectedPair[0] === j && selectedPair[1] === i);
                      const val = cell?.shingleOverlapPct ?? 0;

                      const cellStyle = isDiag
                        ? 'bg-[var(--cw-sunken)] text-[var(--cw-ink-4)]'
                        : val >= 40
                        ? 'bg-[var(--cw-stylo-wash)] text-[var(--cw-stylo-ink)] font-bold'
                        : val >= 15
                        ? 'bg-[var(--cw-attest-wash)] text-[var(--cw-attest-ink)] font-semibold'
                        : 'bg-[var(--cw-raised)] text-[var(--cw-ink-2)]';

                      return (
                        <td key={colDoc.id} className="p-1.5 text-center">
                          <button
                            type="button"
                            disabled={isDiag}
                            onClick={() => setSelectedPair([i, j])}
                            className={`w-full py-2.5 px-2 rounded-[5px] cw-mono transition-all ${cellStyle} ${
                              isSelected && !isDiag
                                ? 'ring-2 ring-[var(--cw-signal)]'
                                : ''
                            } ${isDiag ? 'cursor-default' : 'cursor-pointer hover:opacity-90'}`}
                          >
                            {isDiag ? '—' : `${val}%`}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form
            onSubmit={handleAddDoc}
            className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-5 space-y-3"
          >
            <div className="cw-mono text-xs font-semibold uppercase text-[var(--cw-ink-2)]">
              Add Submission to Cohort Matrix
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Submission title (e.g., Submission E)"
                className="px-3 py-2 rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-xs text-[var(--cw-ink)]"
              />
              <input
                type="text"
                value={newStudent}
                onChange={(e) => setNewStudent(e.target.value)}
                placeholder="Author ID (e.g., Student 1192)"
                className="px-3 py-2 rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-xs text-[var(--cw-ink)]"
              />
            </div>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={3}
              placeholder="Paste submission text to compute pairwise Winnowing and MinHash resemblance..."
              className="w-full p-3 rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-xs text-[var(--cw-ink)]"
            />
            <button type="submit" className="cw-btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Append Submission to Cohort</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] p-5 space-y-4">
          <div className="cw-kicker">SELECTED PAIR FORENSIC DIFF</div>
          {docA && docB ? (
            <>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--cw-rule)]">
                <div>
                  <div className="font-semibold text-sm text-[var(--cw-ink)]">
                    {docA.title}
                  </div>
                  <div className="text-xs text-[var(--cw-ink-3)]">vs. {docB.title}</div>
                </div>
                <div className="text-right">
                  <div className="cw-mono text-2xl font-bold text-[var(--cw-corpus-ink)]">
                    {pairCell.shingleOverlapPct}%
                  </div>
                  <div className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
                    {pairCell.sharedWinnowHashes} Winnow Hashes
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-[6px] bg-[var(--cw-sunken)] border border-[var(--cw-rule)]">
                  <div className="cw-mono font-semibold text-[var(--cw-ink-2)] mb-1">
                    {docA.student} ({docA.title})
                  </div>
                  <p className="text-[var(--cw-ink)] leading-relaxed">{docA.text}</p>
                </div>

                <div className="p-3 rounded-[6px] bg-[var(--cw-sunken)] border border-[var(--cw-rule)]">
                  <div className="cw-mono font-semibold text-[var(--cw-ink-2)] mb-1">
                    {docB.student} ({docB.title})
                  </div>
                  <p className="text-[var(--cw-ink)] leading-relaxed">{docB.text}</p>
                </div>

                <div className="p-3 rounded-[6px] bg-[var(--cw-paper)] border border-[var(--cw-rule)]">
                  <div className="cw-mono text-[11px] uppercase text-[var(--cw-ink-3)] mb-1.5">
                    Sample Shared 3-Gram Shingles ({pairCell.sharedShingles.length} total):
                  </div>
                  {pairCell.sharedShingles.length === 0 ? (
                    <span className="text-[var(--cw-ink-3)]">
                      Zero shared 3-word shingles detected between these two manuscripts.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {pairCell.sharedShingles.slice(0, 14).map((sh) => (
                        <code
                          key={sh}
                          className="cw-mono text-[11px] px-2 py-0.5 rounded bg-[var(--cw-corpus-wash)] text-[var(--cw-corpus-ink)] border border-[var(--cw-corpus-rule)]"
                        >
                          {sh}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

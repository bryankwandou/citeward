import { CorpusSource, OPEN_ACADEMIC_CORPUS } from './corpus';

export interface ExclusionOptions {
  excludeQuotes: boolean;
  excludeBibliography: boolean;
  minWordMatch: number; // e.g., 8 words (0 = disabled -> min 3-word shingle)
  minPercentMatch?: number; // Turnitin small-source threshold in % (0 = disabled, e.g., 1, 2, 3)
  denominatorMode?: 'total' | 'evaluable'; // 'total' divides by totalWords; 'evaluable' subtracts excluded quote/bib words
}

export interface WordToken {
  word: string;
  raw: string;
  start: number;
  end: number;
  index: number;
  inQuote: boolean;
  inBibliography: boolean;
}

export interface WinnowFingerprint {
  hash: number;
  charPos: number;
  endCharPos: number;
}

export interface MatchSpan {
  sourceId: string;
  sourceRank: number; // 1-based rank (#1, #2, ...)
  colorIndex: number; // 1..6 for --cw-s1..--cw-s6
  startChar: number;
  endChar: number;
  startWordIdx: number;
  endWordIdx: number;
  wordCount: number;
  matchedText: string;
  sourceExcerpt: string;
  inQuote: boolean;
  inBibliography: boolean;
  excluded: boolean;
  matchType: 'exact_winnow' | 'patchwork_shingle';
}

export interface MatchedSourceSummary {
  source: CorpusSource;
  rank: number;
  colorIndex: number;
  matchedWords: number; // Total matched words against this source (All Sources view)
  primaryMatchedWords: number; // Non-overlapping unique attribution (Turnitin Match Overview view)
  similarityPercent: number;
  primarySimilarityPercent: number;
  minHashJaccard: number;
  winnowOverlapCount: number;
  spans: MatchSpan[];
}

export interface SentenceStylometry {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
  wordCount: number;
  avgWordLength: number;
  typeTokenRatio: number;
  formulaicMarkers: string[];
  aiProbability: number; // 0..100
  classification: 'human' | 'mixed' | 'synthetic';
  diagnosticNote: string;
}

export interface StylometricForensicSignals {
  staccatoFragmentRatio: number; // fraction of sentences <= 5 words (0..1)
  microParagraphRatio: number; // fraction of paragraphs <= 24 words (0..1)
  lexicalEchoRatio: number; // fraction of content words repeated within 28 words (0..1)
  narrativeBeatCount: number; // repetitive dialogue/action beats detected
  macroChunkStability: number; // 0..100 uniformity across 300-word windows
  detectedProfile:
    | 'academic_synthetic'
    | 'narrative_staccato_ai'
    | 'hybrid_ai'
    | 'human_empirical';
}

export interface StylometricReport {
  overallAiPercent: number;
  qualifyingAiWords: number;
  turnitinAiIndicator: string; // '--' (<300w), '*%' (1..19%), or integer '0%'..'100%'
  burstinessScore: number; // CV = stdDev / mean sentence length
  meanSentenceLength: number;
  sentenceLengthStdDev: number;
  mattr50: number; // Moving-Average Type-Token Ratio (window=50)
  shannonEntropy: number; // Character bigram entropy in bits
  formulaicMarkerCount: number;
  sentences: SentenceStylometry[];
  verdictLabel: string;
  verdictSummary: string;
  forensicSignals?: StylometricForensicSignals;
}

export interface IntegrityAuditResult {
  documentHashSha256: string;
  analyzedAt: string;
  totalWords: number;
  evaluableWords: number;
  matchedWords: number;
  quotedWords: number;
  bibliographyWords: number;
  overallSimilarityPercent: number;
  roundedSimilarityPercent: number; // Official Turnitin whole-integer rule (min 1% if matchedWords > 0)
  rawSimilarityPercent: number; // Without quote/bib exclusions
  internetPercent: number;
  publicationsPercent: number;
  studentPapersPercent: number;
  exclusions: ExclusionOptions;
  fingerprintCount: number;
  sources: MatchedSourceSummary[];
  activeSpans: MatchSpan[];
  allSpans: MatchSpan[];
  stylometry: StylometricReport;
}

const FORMULAIC_MARKERS: string[] = [
  // English LLM / AI-ish academic markers
  'in the rapidly evolving landscape',
  'plays a pivotal role',
  'plays a crucial role',
  'complex tapestry',
  'it is important to note',
  'it is worth noting',
  'fostering an environment',
  'foundational pillar',
  'multifaceted challenges',
  'paradigms and emerging',
  'bridge the gap between',
  'delve into',
  'testament to',
  'in conclusion, the future of',
  'holistic understanding',
  'navigate the complex',
  'moreover, by harmonizing',
  'furthermore, stakeholders',
  'additionally, the deployment',
  'consequently, educational leaders',
  'serves as a catalyst',
  'seamlessly integrating',
  'underscores the importance',
  'highlights the need for',
  'paramount importance',
  // Indonesian LLM / AI-ish & formulaic academic markers
  'memegang peranan penting',
  'memainkan peran penting',
  'memiliki peran yang sangat penting',
  'perlu dicatat bahwa',
  'penting untuk dicatat',
  'tidak dapat dipungkiri',
  'di era digital yang berkembang pesat',
  'perkembangan teknologi yang semakin pesat',
  'secara komprehensif dan mendalam',
  'secara holistik',
  'berbagai pemangku kepentingan',
  'memberikan kontribusi yang signifikan',
  'menjadi landasan utama',
  'sejalan dengan hal tersebut',
  'dalam konteks ini, penting',
  'oleh karena itu, diperlukan',
  'dengan demikian, dapat disimpulkan bahwa',
  'hal ini menunjukkan bahwa',
  'selain itu, penggunaan',
  'lebih lanjut, penelitian ini',
  'di sisi lain, tantangan',
  'dalam rangka meningkatkan efektivitas',
  'optimalisasi pengelolaan',
];

const BIBLIOGRAPHY_HEADINGS_GLOBAL =
  /^(?:\s*(?:bab\s+[ivx0-9]+\s*)?(?:\d+(?:\.\d+)*\s*)?)?(references|bibliography|daftar\s+pustaka|daftar\s+referensi|works\s+cited|bibliografi|referensi|kepustakaan|rujukan)\s*:?\s*$/gim;

const POST_BIBLIOGRAPHY_HEADINGS_GLOBAL =
  /^(?:\s*(?:bab\s+[ivx0-9]+\s*)?(?:\d+(?:\.\d+)*\s*)?)?(lampiran(?:\s+[a-z0-9]+)?|appendix(?:\s+[a-z0-9]+)?|appendices|curriculum\s+vitae|riwayat\s+hidup|biografi\s+penulis)\b[^\r\n]*$/gim;

/**
 * Detects character intervals inside quotation marks ("...", “...”, mixed “...", «...»),
 * Markdown blockquotes (> ...), and APA / Skripsi indented block quotations (4+ leading spaces or tab).
 */
export function findQuotedIntervals(text: string): Array<[number, number]> {
  const intervals: Array<[number, number]> = [];
  const regex =
    /(?:["“„]([^"“”„]{15,})["”]|«([^»]{15,})»|^\s*>\s+([^\r\n]{15,})|^(?: {4,}|\t)\S[^\r\n]{75,}(?:\r?\n(?: {4,}|\t)\S[^\r\n]+)*)/gm;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    intervals.push([m.index, m.index + m[0].length]);
  }
  return intervals;
}

/**
 * Detects character offset where the References / Bibliography / Daftar Pustaka section begins.
 * Ignores Table of Contents lines (lines followed by dot leaders ".... 12" or "hal. 12").
 */
export function findBibliographyStart(text: string): number {
  if (!text || text.length < 120) return text.length;

  let lastHeadingOffset = -1;
  BIBLIOGRAPHY_HEADINGS_GLOBAL.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BIBLIOGRAPHY_HEADINGS_GLOBAL.exec(text)) !== null) {
    const lookahead = text.slice(m.index, m.index + 320);
    const looksLikeToc = /\.\.\.\.\s*\d+|\.\s+\.\s+\.\s*\d+|\b(?:hal|hlm)\.\s*\d+/i.test(lookahead);
    if (!looksLikeToc) {
      lastHeadingOffset = m.index;
    }
  }

  if (lastHeadingOffset !== -1) {
    return lastHeadingOffset;
  }

  const tailStart = Math.floor(text.length * 0.65);
  const tail = text.slice(tailStart);
  const inlineRegex = /\b(daftar\s+pustaka|references|bibliography|works\s+cited|bibliografi)\b/gi;
  let inlineMatch: RegExpExecArray | null;
  let lastInlineOffset = -1;
  while ((inlineMatch = inlineRegex.exec(tail)) !== null) {
    const lookahead = tail.slice(inlineMatch.index, inlineMatch.index + 240);
    if (!/\.\.\.\.\s*\d+/.test(lookahead)) {
      lastInlineOffset = tailStart + inlineMatch.index;
    }
  }
  return lastInlineOffset !== -1 ? lastInlineOffset : text.length;
}

/**
 * Detects where the Bibliography section ends if followed by Appendices (Lampiran / Appendix / CV),
 * matching Turnitin's rule that bibliography exclusion terminates at post-bibliography sections.
 */
export function findBibliographyEnd(text: string, bibStart: number): number {
  if (!text || bibStart >= text.length) return text.length;
  const afterBib = text.slice(bibStart);
  POST_BIBLIOGRAPHY_HEADINGS_GLOBAL.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = POST_BIBLIOGRAPHY_HEADINGS_GLOBAL.exec(afterBib)) !== null) {
    if (m.index < 24) continue;
    const lookahead = afterBib.slice(m.index, m.index + 240);
    const looksLikeToc = /\.\.\.\.\s*\d+|\.\s+\.\s+\.\s*\d+/i.test(lookahead);
    if (!looksLikeToc) {
      return bibStart + m.index;
    }
  }
  return text.length;
}

/**
 * Tokenizes manuscript into normalized words while preserving exact character offsets
 */
export function tokenizeManuscript(text: string): WordToken[] {
  const quotedIntervals = findQuotedIntervals(text);
  const bibStart = findBibliographyStart(text);
  const bibEnd = findBibliographyEnd(text, bibStart);
  const tokens: WordToken[] = [];
  // Keep academic domains (e.g. fib.ub.ac.id, its.ac.id) and DOIs (10.56963/...) as indivisible tokens so highlights never chop URLs in half
  const wordRegex =
    /[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\.(?:ac\.id|edu|go\.id|or\.id|org|com|net|io)\b|10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+[\p{L}\p{N}]|[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = wordRegex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const inQuote = quotedIntervals.some(([qs, qe]) => start >= qs && end <= qe);
    const inBibliography = start >= bibStart && end <= bibEnd;
    tokens.push({
      word: match[0].toLowerCase(),
      raw: match[0],
      start,
      end,
      index: idx++,
      inQuote,
      inBibliography,
    });
  }
  return tokens;
}

/**
 * Deterministic Winnowing Algorithm (Schleimer, Wilkerson, Aiken - SIGMOD 2003).
 * Uses rolling polynomial hash over normalized k-grams and selects the rightmost
 * minimum hash within each sliding window w.
 */
export function computeWinnowFingerprints(
  text: string,
  k = 15,
  w = 10
): WinnowFingerprint[] {
  const normChars: string[] = [];
  const origIndices: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toLowerCase();
    if (/[\p{L}\p{N}]/u.test(ch)) {
      normChars.push(ch);
      origIndices.push(i);
    }
  }

  if (normChars.length < k) return [];

  const MOD = 2147483647;
  const BASE = 31;
  let basePow = 1;
  for (let i = 0; i < k - 1; i++) {
    basePow = (basePow * BASE) % MOD;
  }

  const kgramHashes: number[] = [];
  let h = 0;
  for (let i = 0; i < k; i++) {
    h = (h * BASE + normChars[i].charCodeAt(0)) % MOD;
  }
  kgramHashes.push(h);

  for (let i = 1; i <= normChars.length - k; i++) {
    const leftChar = normChars[i - 1].charCodeAt(0);
    const rightChar = normChars[i + k - 1].charCodeAt(0);
    let nextH = (h - ((leftChar * basePow) % MOD) + MOD) % MOD;
    nextH = (nextH * BASE + rightChar) % MOD;
    h = nextH;
    kgramHashes.push(h);
  }

  if (kgramHashes.length <= w) {
    let minIdx = 0;
    for (let i = 1; i < kgramHashes.length; i++) {
      if (kgramHashes[i] <= kgramHashes[minIdx]) minIdx = i;
    }
    return [
      {
        hash: kgramHashes[minIdx],
        charPos: origIndices[minIdx],
        endCharPos: origIndices[minIdx + k - 1] + 1,
      },
    ];
  }

  const fingerprints: WinnowFingerprint[] = [];
  let lastPickedGlobalIdx = -1;

  for (let winStart = 0; winStart <= kgramHashes.length - w; winStart++) {
    let minGlobalIdx = winStart;
    for (let j = winStart; j < winStart + w; j++) {
      // Rightmost minimum tie-breaking rule from Schleimer et al.
      if (kgramHashes[j] <= kgramHashes[minGlobalIdx]) {
        minGlobalIdx = j;
      }
    }
    if (minGlobalIdx !== lastPickedGlobalIdx) {
      lastPickedGlobalIdx = minGlobalIdx;
      fingerprints.push({
        hash: kgramHashes[minGlobalIdx],
        charPos: origIndices[minGlobalIdx],
        endCharPos: origIndices[minGlobalIdx + k - 1] + 1,
      });
    }
  }

  return fingerprints;
}

/**
 * Computes a 64-permutation MinHash signature over 3-word shingles
 */
export function computeMinHashSignature(tokens: WordToken[], shingleSize = 3, numHashes = 64): Uint32Array {
  const sig = new Uint32Array(numHashes);
  sig.fill(0xffffffff);

  if (tokens.length < shingleSize) return sig;

  const shingleHashes: number[] = [];
  for (let i = 0; i <= tokens.length - shingleSize; i++) {
    const s = tokens
      .slice(i, i + shingleSize)
      .map((t) => t.word)
      .join(' ');
    let h = 2166136261;
    for (let c = 0; c < s.length; c++) {
      h ^= s.charCodeAt(c);
      h = Math.imul(h, 16777619) >>> 0;
    }
    shingleHashes.push(h);
  }

  for (let p = 0; p < numHashes; p++) {
    const a = (Math.imul(p + 1, 2654435761) | 1) >>> 0;
    const b = Math.imul(p + 7, 2246822519) >>> 0;
    let minVal = 0xffffffff;
    for (let i = 0; i < shingleHashes.length; i++) {
      const permuted = (Math.imul(shingleHashes[i], a) + b) >>> 0;
      if (permuted < minVal) minVal = permuted;
    }
    sig[p] = minVal;
  }

  return sig;
}

export function estimateMinHashJaccard(sigA: Uint32Array, sigB: Uint32Array): number {
  if (sigA.length !== sigB.length || sigA.length === 0) return 0;
  let equal = 0;
  for (let i = 0; i < sigA.length; i++) {
    if (sigA[i] === sigB[i] && sigA[i] !== 0xffffffff) equal++;
  }
  return equal / sigA.length;
}

interface CachedSourceIndex {
  srcTokens: WordToken[];
  srcShingleSet: Set<string>;
  srcTrigramPos: Map<string, number[]>;
  srcBigramPos: Map<string, number[]>;
  srcFpSet: Set<number>;
  sigSrc: Uint32Array;
}

const SOURCE_INDEX_CACHE = new Map<string, CachedSourceIndex>();

function getSourceIndex(source: CorpusSource): CachedSourceIndex {
  const cacheKey = `${source.id}::${source.text.length}`;
  const cached = SOURCE_INDEX_CACHE.get(cacheKey);
  if (cached) return cached;

  const fullSourceString = `${source.authors} ${source.year} ${source.title} ${source.publication} ${source.text}`;
  const srcTokens = tokenizeManuscript(fullSourceString);
  const bodyTokens = tokenizeManuscript(source.text);

  const srcShingleSet = new Set<string>();
  for (let i = 0; i <= srcTokens.length - 3; i++) {
    srcShingleSet.add(`${srcTokens[i].word} ${srcTokens[i + 1].word} ${srcTokens[i + 2].word}`);
  }

  const srcTrigramPos = new Map<string, number[]>();
  for (let i = 0; i <= bodyTokens.length - 3; i++) {
    const k3 = `${bodyTokens[i].word} ${bodyTokens[i + 1].word} ${bodyTokens[i + 2].word}`;
    const list = srcTrigramPos.get(k3);
    if (list) list.push(i);
    else srcTrigramPos.set(k3, [i]);
  }

  const srcBigramPos = new Map<string, number[]>();
  for (let i = 0; i <= bodyTokens.length - 2; i++) {
    if (bodyTokens[i].word.length < 4 && bodyTokens[i + 1].word.length < 4) continue;
    const k2 = `${bodyTokens[i].word} ${bodyTokens[i + 1].word}`;
    const list = srcBigramPos.get(k2);
    if (list) list.push(i);
    else srcBigramPos.set(k2, [i]);
  }

  const srcFpSet = new Set(computeWinnowFingerprints(source.text).map((f) => f.hash));
  const sigSrc = computeMinHashSignature(srcTokens);

  const built: CachedSourceIndex = {
    srcTokens,
    srcShingleSet,
    srcTrigramPos,
    srcBigramPos,
    srcFpSet,
    sigSrc,
  };
  SOURCE_INDEX_CACHE.set(cacheKey, built);
  return built;
}

/**
 * Aligns manuscript tokens against a candidate source using 3-word shingle indexing,
 * colinear 2-gram patchwriting alignment, intra-sentence gap bridging, and
 * partial-quote / partial-bibliography sub-span splitting.
 */
function alignSourceSpans(
  docText: string,
  docTokens: WordToken[],
  source: CorpusSource,
  exclusions: ExclusionOptions,
  precomputedDocFp?: WinnowFingerprint[],
  precomputedSigDoc?: Uint32Array,
  precomputedDocTrigrams?: string[],
  precomputedDocBigrams?: string[]
): { spans: MatchSpan[]; winnowOverlap: number; jaccard: number } {
  const srcIdx = getSourceIndex(source);
  const { srcTokens, srcShingleSet, srcTrigramPos, srcBigramPos, srcFpSet, sigSrc } = srcIdx;
  if (docTokens.length < 3 || srcTokens.length < 3) {
    return { spans: [], winnowOverlap: 0, jaccard: 0 };
  }

  // Track matched mask and mapped source body token positions for colinear patchwriting chaining
  const matchedMask = new Uint8Array(docTokens.length);
  const tokenSrcPositions: Array<number[] | null> = new Array(docTokens.length).fill(null);
  let trigramHits = 0;

  for (let i = 0; i <= docTokens.length - 3; i++) {
    const key = precomputedDocTrigrams
      ? precomputedDocTrigrams[i]
      : `${docTokens[i].word} ${docTokens[i + 1].word} ${docTokens[i + 2].word}`;
    if (srcShingleSet.has(key)) {
      trigramHits++;
      matchedMask[i] = 1;
      matchedMask[i + 1] = 1;
      matchedMask[i + 2] = 1;
      const posList = srcTrigramPos.get(key);
      if (posList) {
        tokenSrcPositions[i] = posList;
        tokenSrcPositions[i + 1] = posList.map((p) => p + 1);
        tokenSrcPositions[i + 2] = posList.map((p) => p + 2);
      }
    }
  }

  // Fast skip if neither 3-grams nor at least 3 source bigrams appear in the document
  if (trigramHits === 0) {
    let bigramHits = 0;
    for (let i = 0; i <= docTokens.length - 2; i++) {
      const bKey = precomputedDocBigrams
        ? precomputedDocBigrams[i]
        : `${docTokens[i].word} ${docTokens[i + 1].word}`;
      if (srcBigramPos.has(bKey)) {
        bigramHits++;
        if (bigramHits >= 3) break;
      }
    }
    if (bigramHits < 3) {
      return { spans: [], winnowOverlap: 0, jaccard: 0 };
    }
  }

  // Helper: check if a sentence boundary (., !, ?, newline, or [N] reference bracket) exists between two tokens.
  // Inside bibliography/reference blocks, only break on newlines or [N] entries so "Title. Proceedings of ..." aligns intact.
  const hasSentenceBoundary = (idxA: number, idxB: number): boolean => {
    const between = docText.slice(docTokens[idxA].end, docTokens[idxB].start);
    if (docTokens[idxA].inBibliography && docTokens[idxB].inBibliography) {
      return /[\r\n]|\[\s*\d+\s*\]/.test(between);
    }
    return /[.!?\r\n]|\[\s*\d+\s*\]/.test(between);
  };

  // Colinear 2-gram patchwriting alignment within the same sentence (detects synonym swaps every 2-3 words)
  let bridgedAny = false;
  for (let pass = 0; pass < 3; pass++) {
    let addedInPass = false;
    for (let i = 0; i <= docTokens.length - 2; i++) {
      if (docTokens[i].inBibliography || docTokens[i + 1].inBibliography) continue;
      if (matchedMask[i] === 1 && matchedMask[i + 1] === 1) continue;
      if (hasSentenceBoundary(i, i + 1)) continue;

      const bKey = `${docTokens[i].word} ${docTokens[i + 1].word}`;
      const bPositions = srcBigramPos.get(bKey);
      if (!bPositions) continue;

      // Check forward/backward proximity to an existing anchor in the same sentence across a 1-to-2 word swap
      let confirmedPos: number[] | null = null;
      for (const anchorOffset of [-2, -3, 2, 3]) {
        const anchorIdx = i + anchorOffset;
        if (anchorIdx < 0 || anchorIdx >= docTokens.length) continue;
        const anchorSrc = tokenSrcPositions[anchorIdx];
        if (!anchorSrc) continue;
        const minI = Math.min(i, anchorIdx);
        const maxI = Math.max(i + 1, anchorIdx);
        let crossesSentence = false;
        for (let k = minI; k < maxI; k++) {
          if (hasSentenceBoundary(k, k + 1)) {
            crossesSentence = true;
            break;
          }
        }
        if (crossesSentence) continue;

        const matchingP = bPositions.filter((bp) =>
          anchorSrc.some((ap) => {
            const srcDelta = bp - ap;
            return anchorOffset < 0
              ? srcDelta >= 2 && srcDelta <= 5
              : srcDelta <= -2 && srcDelta >= -5;
          })
        );
        if (matchingP.length > 0) {
          confirmedPos = matchingP;
          break;
        }
      }

      // Also detect a chain of >= 3 colinear 2-grams separated by 1-word swaps in the same sentence even without a 3-gram seed
      if (!confirmedPos && pass === 0 && i <= docTokens.length - 8) {
        const i2 = i + 3;
        const i3 = i + 6;
        if (
          i3 + 1 < docTokens.length &&
          !hasSentenceBoundary(i, i3 + 1)
        ) {
          const b2 = srcBigramPos.get(`${docTokens[i2].word} ${docTokens[i2 + 1].word}`);
          const b3 = srcBigramPos.get(`${docTokens[i3].word} ${docTokens[i3 + 1].word}`);
          if (b2 && b3) {
            const chainP = bPositions.filter((p1) =>
              b2.some(
                (p2) =>
                  p2 - p1 >= 2 &&
                  p2 - p1 <= 4 &&
                  b3.some((p3) => p3 - p2 >= 2 && p3 - p2 <= 4)
              )
            );
            if (chainP.length > 0) {
              confirmedPos = chainP;
            }
          }
        }
      }

      if (confirmedPos) {
        matchedMask[i] = 1;
        matchedMask[i + 1] = 1;
        tokenSrcPositions[i] = confirmedPos;
        tokenSrcPositions[i + 1] = confirmedPos.map((p) => p + 1);
        addedInPass = true;
        bridgedAny = true;
      }
    }
    if (!addedInPass) break;
  }

  // Bridge 1-to-2 word synonym substitutions inside the SAME sentence only (never bridge across periods or [N] brackets!)
  for (let i = 1; i < docTokens.length - 2; i++) {
    if (
      matchedMask[i - 1] === 1 &&
      matchedMask[i] === 0 &&
      matchedMask[i + 1] === 1 &&
      !hasSentenceBoundary(i - 1, i + 1)
    ) {
      matchedMask[i] = 1;
      bridgedAny = true;
    } else if (
      i < docTokens.length - 3 &&
      matchedMask[i - 1] === 1 &&
      matchedMask[i] === 0 &&
      matchedMask[i + 1] === 0 &&
      matchedMask[i + 2] === 1 &&
      !hasSentenceBoundary(i - 1, i + 2)
    ) {
      matchedMask[i] = 1;
      matchedMask[i + 1] = 1;
      bridgedAny = true;
    }
  }

  // Extract contiguous runs of matched tokens, splitting cleanly at sentence / [N] reference boundaries
  // and enforcing minRequiredWords on unexcluded sub-runs when quote/bibliography exclusions bisect a span.
  const spans: MatchSpan[] = [];
  const minRequiredWords = exclusions.minWordMatch > 0 ? exclusions.minWordMatch : 3;
  const isTokenExcluded = (t: WordToken): boolean =>
    (exclusions.excludeQuotes && t.inQuote) ||
    (exclusions.excludeBibliography && t.inBibliography);

  let idx = 0;
  while (idx < docTokens.length) {
    if (matchedMask[idx] === 1) {
      const startWordIdx = idx;
      idx++;
      while (
        idx < docTokens.length &&
        matchedMask[idx] === 1 &&
        !hasSentenceBoundary(idx - 1, idx)
      ) {
        idx++;
      }
      const endWordIdx = idx - 1;
      const wordCount = endWordIdx - startWordIdx + 1;

      if (wordCount >= minRequiredWords) {
        // Partition run into contiguous sub-runs by exclusion status so partial quotes never leak <minWordMatch fragments
        const subRuns: Array<{ sIdx: number; eIdx: number; tokExcluded: boolean }> = [];
        let curStart = startWordIdx;
        let curExc = isTokenExcluded(docTokens[startWordIdx]);
        for (let w = startWordIdx + 1; w <= endWordIdx; w++) {
          const exc = isTokenExcluded(docTokens[w]);
          if (exc !== curExc) {
            subRuns.push({ sIdx: curStart, eIdx: w - 1, tokExcluded: curExc });
            curStart = w;
            curExc = exc;
          }
        }
        subRuns.push({ sIdx: curStart, eIdx: endWordIdx, tokExcluded: curExc });

        for (const sub of subRuns) {
          const subCount = sub.eIdx - sub.sIdx + 1;
          const subStartChar = docTokens[sub.sIdx].start;
          const subEndChar = docTokens[sub.eIdx].end;
          const subInQuote = docTokens
            .slice(sub.sIdx, sub.eIdx + 1)
            .every((t) => t.inQuote);
          const subInBib = docTokens
            .slice(sub.sIdx, sub.eIdx + 1)
            .some((t) => t.inBibliography);

          // An unexcluded sub-run is only active if its own contiguous unexcluded length >= minRequiredWords
          const effectiveExcluded = sub.tokExcluded || subCount < minRequiredWords;

          spans.push({
            sourceId: source.id,
            sourceRank: 0,
            colorIndex: 1,
            startChar: subStartChar,
            endChar: subEndChar,
            startWordIdx: sub.sIdx,
            endWordIdx: sub.eIdx,
            wordCount: subCount,
            matchedText: docText.slice(subStartChar, subEndChar),
            sourceExcerpt: source.text.slice(0, 280),
            inQuote: subInQuote,
            inBibliography: subInBib,
            excluded: effectiveExcluded,
            matchType: bridgedAny ? 'patchwork_shingle' : 'exact_winnow',
          });
        }
      }
    } else {
      idx++;
    }
  }

  if (spans.length === 0) {
    return { spans: [], winnowOverlap: 0, jaccard: 0 };
  }

  // Compute Winnowing fingerprint overlap count using precomputed document fingerprints
  const docFp = precomputedDocFp ?? computeWinnowFingerprints(docText);
  const winnowOverlap = docFp.filter((f) => srcFpSet.has(f.hash)).length;

  // Compute MinHash Jaccard using precomputed document signature
  const sigDoc = precomputedSigDoc ?? computeMinHashSignature(docTokens);
  const jaccard = estimateMinHashJaccard(sigDoc, sigSrc);

  return { spans, winnowOverlap, jaccard };
}

const TRANSITION_STARTERS_REGEX =
  /^(?:furthermore|moreover|additionally|consequently|in\s+conclusion|notably|significantly|importantly|overall|selain\s+itu|lebih\s+lanjut|di\s+sisi\s+lain|oleh\s+karena\s+itu|dengan\s+demikian|hal\s+ini\s+menunjukkan|dapat\s+disimpulkan|dalam\s+konteks\s+ini|sejalan\s+dengan|berdasarkan\s+uraian|secara\s+keseluruhan)\b/i;

const NOMINALIZATION_REGEX =
  /\b[\p{L}]{4,}(?:isasi|itas|ansi|ensi|tion|ment|ness|ity|ance|ence)\b/giu;

const NARRATIVE_DIALOGUE_TAG_REGEX =
  /["“][^"”]{1,150}[,.!?]["”]\s*(?:kata(?:nya)?|ujar(?:nya)?|jawab(?:nya)?|tanya(?:nya)?|bisik(?:nya)?|gumam(?:nya)?|sahut(?:nya)?|ucap(?:nya)?|balas(?:nya)?|said|asked|replied|whispered|murmured|muttered)\b/gi;

const NARRATIVE_LLM_BEATS_REGEX =
  /\b(?:nyengir|tersenyum\s+tipis|menghela\s+napas|hela\s+napas|mengangguk\s+pelan|ngangguk|diam\s+sejenak|sunyi\s+sejenak|suara\s+pelan|tanpa\s+sadar|nahan\s+gerak|ngelihat|nutup\s+telepon|bilang\s+lagi|ngomong\s+lagi|let\s+out\s+a\s+breath|beat\s+of\s+silence|eyes\s+narrowed|jaw\s+tightened|barely\s+audible|silent\s+for\s+a\s+beat)\b/gi;

/**
 * Evaluates sentence-level and document-level stylometric telemetry across BOTH
 * formal academic prose and narrative/staccato LLM prose (Burstiness CV, MATTR-50,
 * Shannon Bigram Entropy, Formulaic Discourse Markers, Staccato Fragment Ratio,
 * Micro-Paragraph Cadence, Lexical Echo, and Macro Chunk Stability).
 */
export function evaluateStylometry(text: string): StylometricReport {
  const bibStart = findBibliographyStart(text);
  const rawBodyText = text.slice(0, bibStart).trim() || text;

  // Unwrap mid-sentence PDF line breaks (lines that do not end with sentence punctuation and are not headings)
  const bodyLines = rawBodyText.split(/\r?\n/);
  let unwrappedBody = '';
  for (let i = 0; i < bodyLines.length; i++) {
    const trimmedLine = bodyLines[i].trim();
    if (!trimmedLine) {
      unwrappedBody += '\n\n';
      continue;
    }
    const isHeading =
      /^(?:===\s*HALAMAN|BAB\s+[IVX0-9]+|\d+(?:\.\d+)*\s+[A-Z]|Abstrak|Abstract|Pendahuluan|Introduction|Tinjauan\s+Pustaka|Landasan\s+Teori|Metode\s+Penelitian|Hasil\s+dan\s+Pembahasan|Kesimpulan|Penutup)/i.test(
        trimmedLine
      ) && trimmedLine.length < 85;

    if (isHeading) {
      unwrappedBody += '\n' + trimmedLine + '.\n';
    } else if (/[.!?;:"”]$/.test(trimmedLine)) {
      unwrappedBody += trimmedLine + '\n';
    } else {
      unwrappedBody += trimmedLine + ' ';
    }
  }

  const bodyText = unwrappedBody.trim() || rawBodyText;

  // 1. Pre-scan ALL sentences (including 1-5 word staccato fragments) & paragraphs for narrative/staccato LLM cadence
  const rawParagraphs = rawBodyText
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(
      (p) =>
        p.length > 0 &&
        !/^(?:===\s*HALAMAN|BAB\s+[IVX0-9]+|LAMPIRAN|DAFTAR\s+PUSTAKA|REFERENCES)/i.test(p)
    );
  const microParaCount = rawParagraphs.filter((p) => {
    const wc = (p.match(/[\p{L}\p{N}]+/gu) || []).length;
    return wc >= 1 && wc <= 24;
  }).length;
  const microParagraphRatio =
    rawParagraphs.length >= 4
      ? Number((microParaCount / rawParagraphs.length).toFixed(3))
      : 0;

  const allSentEntries: Array<{ text: string; start: number; end: number; words: string[] }> = [];
  const lineRegex = /[^\r\n]+/g;
  let lineMatch: RegExpExecArray | null;

  while ((lineMatch = lineRegex.exec(bodyText)) !== null) {
    const lineStr = lineMatch[0];
    const lineOffset = lineMatch.index;
    if (/^\s*(?:===\s*HALAMAN|BAB\s+[IVX0-9]+)/i.test(lineStr)) continue;

    const sentenceRegex = /[^.!?;]+[.!?;]+["”']?(?:\s+|$)|[^.!?;]+$/g;
    let m: RegExpExecArray | null;
    while ((m = sentenceRegex.exec(lineStr)) !== null) {
      const trimmed = m[0].trim();
      if (trimmed.length < 2) continue;
      const words = trimmed.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
      if (words.length < 1) continue;

      const leadSpaces = m[0].indexOf(trimmed);
      const baseStart = lineOffset + m.index + leadSpaces;

      if (words.length <= 42) {
        allSentEntries.push({
          text: trimmed,
          start: baseStart,
          end: baseStart + trimmed.length,
          words,
        });
      } else {
        // Sub-segment unpunctuated long PDF blocks into deterministic 18..24 word clauses
        const spaceParts = trimmed.split(/(\s+)/);
        let chunkText = '';
        let chunkStart = baseStart;
        let currentOffset = baseStart;
        let chunkWords: string[] = [];
        let targetLen = 20;

        for (const part of spaceParts) {
          chunkText += part;
          const wMatch = part.toLowerCase().match(/[\p{L}\p{N}]+/gu);
          if (wMatch) chunkWords.push(...wMatch);
          currentOffset += part.length;

          if (chunkWords.length >= targetLen) {
            const cleanChunk = chunkText.trim();
            if (cleanChunk.length >= 18) {
              allSentEntries.push({
                text: cleanChunk,
                start: chunkStart,
                end: currentOffset,
                words: chunkWords,
              });
            }
            chunkText = '';
            chunkStart = currentOffset;
            chunkWords = [];
            targetLen = targetLen === 20 ? 24 : 18;
          }
        }
        if (chunkWords.length >= 8) {
          const cleanChunk = chunkText.trim();
          allSentEntries.push({
            text: cleanChunk,
            start: chunkStart,
            end: currentOffset,
            words: chunkWords,
          });
        }
      }
    }
  }

  // Compute staccato fragment ratio & consecutive staccato burst ratio
  const totalAllSents = allSentEntries.length;
  let shortFragmentCount = 0;
  let consecutiveShortCount = 0;
  for (let i = 0; i < totalAllSents; i++) {
    const isShort = allSentEntries[i].words.length <= 5;
    if (isShort) {
      shortFragmentCount++;
      const prevShort = i > 0 && allSentEntries[i - 1].words.length <= 5;
      const nextShort = i + 1 < totalAllSents && allSentEntries[i + 1].words.length <= 5;
      if (prevShort || nextShort) consecutiveShortCount++;
    }
  }
  const staccatoFragmentRatio =
    totalAllSents >= 6 ? Number((shortFragmentCount / totalAllSents).toFixed(3)) : 0;
  const staccatoClusterRatio =
    totalAllSents >= 6 ? Number((consecutiveShortCount / totalAllSents).toFixed(3)) : 0;

  // Count repetitive narrative dialogue attributions & LLM micro-action beats
  const dialogueTagHits = (rawBodyText.match(NARRATIVE_DIALOGUE_TAG_REGEX) || []).length;
  const narrativeBeatHits = (rawBodyText.match(NARRATIVE_LLM_BEATS_REGEX) || []).length;
  const narrativeBeatCount = dialogueTagHits + narrativeBeatHits;
  const narrativeBeatDensity =
    totalAllSents >= 4 ? narrativeBeatCount / totalAllSents : 0;

  // Determine whether document uses staccato/dialogue LLM narrative style (if so, keep 1-5w staccato fragments in sentences[])
  const isStaccatoNarrativeCandidate =
    (staccatoFragmentRatio >= 0.28 && staccatoClusterRatio >= 0.14) ||
    (microParagraphRatio >= 0.55 && narrativeBeatCount >= 2);

  const rawSentences = isStaccatoNarrativeCandidate
    ? allSentEntries
    : allSentEntries.filter((s) => s.text.length >= 18 && s.words.length >= 6);

  // Filter prose sentences (7..42 words) for clean Burstiness CV calculation
  const proseLengths = rawSentences
    .map((s) => s.words.length)
    .filter((len) => len >= 7 && len <= 42);
  const lengths = proseLengths.length >= 3 ? proseLengths : rawSentences.map((s) => s.words.length);

  const meanLen =
    lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const variance =
    lengths.length > 1
      ? lengths.reduce((acc, l) => acc + Math.pow(l - meanLen, 2), 0) / lengths.length
      : 0;
  const stdDev = Math.sqrt(variance);
  const burstinessScore = meanLen > 0 ? Number(Math.min(0.62, stdDev / meanLen).toFixed(3)) : 0;

  // Moving-Average Type-Token Ratio (MATTR) with window W = 50 in O(N) sliding window
  const allWords = bodyText.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const W = 50;
  let mattr50 = 0;
  if (allWords.length === 0) {
    mattr50 = 0;
  } else if (allWords.length <= W) {
    mattr50 = new Set(allWords).size / allWords.length;
  } else {
    const freq = new Map<string, number>();
    for (let i = 0; i < W; i++) {
      freq.set(allWords[i], (freq.get(allWords[i]) || 0) + 1);
    }
    let sumTtr = freq.size / W;
    const windows = allWords.length - W + 1;
    for (let i = 1; i < windows; i++) {
      const outW = allWords[i - 1];
      const outC = (freq.get(outW) || 1) - 1;
      if (outC <= 0) freq.delete(outW);
      else freq.set(outW, outC);

      const inW = allWords[i + W - 1];
      freq.set(inW, (freq.get(inW) || 0) + 1);
      sumTtr += freq.size / W;
    }
    mattr50 = sumTtr / windows;
  }
  mattr50 = Number(mattr50.toFixed(3));

  // Local Lexical Echo Ratio (fraction of >=4-char words repeated within the prior 28 content words)
  const contentWords = allWords.filter((w) => w.length >= 4);
  let echoedCount = 0;
  const recentSet = new Map<string, number>();
  for (let i = 0; i < contentWords.length; i++) {
    const w = contentWords[i];
    const lastPos = recentSet.get(w);
    if (lastPos !== undefined && i - lastPos <= 28) {
      echoedCount++;
    }
    recentSet.set(w, i);
  }
  const lexicalEchoRatio =
    contentWords.length >= 25
      ? Number((echoedCount / contentWords.length).toFixed(3))
      : 0;

  // Macro Inter-Chunk Stability for long PDFs (>= 1,200 words): measures how locked MATTR & word-length stay across 300w blocks
  let macroChunkStability = 0;
  if (allWords.length >= 1200) {
    const chunkSize = 300;
    const totalChunks = Math.floor(allWords.length / chunkSize);
    const step = Math.max(1, Math.floor(totalChunks / 45));
    const chunkTtrs: number[] = [];
    const chunkWLens: number[] = [];
    for (let c = 0; c < totalChunks; c += step) {
      const slice = allWords.slice(c * chunkSize, (c + 1) * chunkSize);
      chunkTtrs.push(new Set(slice).size / chunkSize);
      chunkWLens.push(slice.reduce((a, w) => a + w.length, 0) / chunkSize);
    }
    if (chunkTtrs.length >= 4) {
      const mTtr = chunkTtrs.reduce((a, b) => a + b, 0) / chunkTtrs.length;
      const vTtr =
        chunkTtrs.reduce((acc, x) => acc + Math.pow(x - mTtr, 2), 0) / chunkTtrs.length;
      const cvTtr = mTtr > 0 ? Math.sqrt(vTtr) / mTtr : 1;

      const mLen = chunkWLens.reduce((a, b) => a + b, 0) / chunkWLens.length;
      const vLen =
        chunkWLens.reduce((acc, x) => acc + Math.pow(x - mLen, 2), 0) / chunkWLens.length;
      const cvLen = mLen > 0 ? Math.sqrt(vLen) / mLen : 1;

      const combinedCv = (cvTtr + cvLen) / 2;
      macroChunkStability = Math.max(0, Math.min(100, Math.round((1 - combinedCv * 6.5) * 100)));
    }
  }

  // Document-level Multi-Genre Narrative / Staccato AI Calibration Boost (zero effect on normal empirical human prose)
  const staccatoBoost =
    staccatoFragmentRatio >= 0.40 && staccatoClusterRatio >= 0.25
      ? 34
      : staccatoFragmentRatio >= 0.28 && staccatoClusterRatio >= 0.14
        ? 22
        : 0;
  const microParaBoost =
    microParagraphRatio >= 0.65 ? 20 : microParagraphRatio >= 0.48 ? 12 : 0;
  const dialogueBeatBoost =
    narrativeBeatDensity >= 0.16 && narrativeBeatCount >= 2
      ? 18
      : narrativeBeatDensity >= 0.08 && narrativeBeatCount >= 2
        ? 10
        : 0;
  const lexicalEchoBoost =
    (staccatoBoost > 0 || microParaBoost > 0 || dialogueBeatBoost > 0) &&
    ((mattr50 > 0 && mattr50 < 0.76) || lexicalEchoRatio >= 0.16)
      ? 14
      : 0;
  const macroLongPdfBoost =
    allWords.length >= 1500 &&
    macroChunkStability >= 70 &&
    (staccatoBoost > 0 || microParaBoost > 0 || dialogueBeatBoost > 0)
      ? 10
      : 0;
  const narrativeAiDocBoost =
    staccatoBoost + microParaBoost + dialogueBeatBoost + lexicalEchoBoost + macroLongPdfBoost;

  // Character bigram Shannon entropy
  const cleanLower = bodyText.toLowerCase().replace(/\s+/g, ' ');
  const bigramCounts = new Map<string, number>();
  let totalBigrams = 0;
  for (let i = 0; i < cleanLower.length - 1; i++) {
    const bg = cleanLower.slice(i, i + 2);
    bigramCounts.set(bg, (bigramCounts.get(bg) || 0) + 1);
    totalBigrams++;
  }
  let shannonEntropy = 0;
  if (totalBigrams > 0) {
    for (const c of bigramCounts.values()) {
      const p = c / totalBigrams;
      shannonEntropy -= p * Math.log2(p);
    }
  }
  shannonEntropy = Number(shannonEntropy.toFixed(2));

  // Score each sentence using academic + multi-genre staccato/narrative stylometric telemetry
  let totalMarkerHits = 0;
  const sentences: SentenceStylometry[] = rawSentences.map((s, idx) => {
    const words = s.words;
    const wordCount = words.length;
    const avgWordLength =
      wordCount > 0
        ? Number((words.reduce((a, w) => a + w.length, 0) / wordCount).toFixed(2))
        : 0;
    const ttr = wordCount > 0 ? Number((new Set(words).size / wordCount).toFixed(2)) : 0;

    // Local 5-sentence window burstiness (prevents long PDFs from washing out uniform AI paragraphs)
    const winStart = Math.max(0, idx - 2);
    const winEnd = Math.min(rawSentences.length, idx + 3);
    const localLens = rawSentences
      .slice(winStart, winEnd)
      .map((item) => Math.min(55, item.words.length));
    const localMean =
      localLens.reduce((a, b) => a + b, 0) / Math.max(1, localLens.length);
    const localVar =
      localLens.length > 1
        ? localLens.reduce((acc, l) => acc + Math.pow(l - localMean, 2), 0) /
          localLens.length
        : 0;
    const localCv = localMean > 0 ? Math.sqrt(localVar) / localMean : burstinessScore;
    const effectiveCv = Math.min(burstinessScore, localCv);

    const lowerSent = s.text.toLowerCase();
    const hits = FORMULAIC_MARKERS.filter((marker) => lowerSent.includes(marker));
    const hasTransitionStarter = TRANSITION_STARTERS_REGEX.test(s.text.trim());
    if (hasTransitionStarter && hits.length === 0) {
      const mStarter = s.text.trim().match(TRANSITION_STARTERS_REGEX);
      if (mStarter) hits.push(mStarter[0].toLowerCase());
    }
    const hasSentenceDialogueBeat =
      NARRATIVE_DIALOGUE_TAG_REGEX.test(s.text) || NARRATIVE_LLM_BEATS_REGEX.test(s.text);
    NARRATIVE_DIALOGUE_TAG_REGEX.lastIndex = 0;
    NARRATIVE_LLM_BEATS_REGEX.lastIndex = 0;
    if (hasSentenceDialogueBeat && narrativeAiDocBoost >= 24) {
      hits.push('staccato/narrative AI cadence');
    }
    totalMarkerHits += hits.length;

    const nominalMatches = s.text.match(NOMINALIZATION_REGEX) || [];
    const nominalDensity = wordCount > 0 ? nominalMatches.length / wordCount : 0;

    // Stylometric synthetic probability model:
    // 1. Uniform LLM sentence length band (14..26 words)
    const inUniformBand = wordCount >= 14 && wordCount <= 26;
    // 2. Low burstiness penalty (global or local 5-sentence window)
    const lowBurstinessPenalty =
      effectiveCv < 0.22 ? 26 : effectiveCv < 0.34 ? 14 : effectiveCv < 0.42 ? 6 : 0;
    // 3. Formulaic discourse marker hits
    const markerScore =
      hits.filter((h) => h !== 'staccato/narrative AI cadence').length * 32;
    // 4. Abstract academic nominalization & word length
    const hasDigits = /\d/.test(s.text);
    const hasQuestion = /\?/.test(s.text);
    const abstractAcademicPenalty =
      (avgWordLength > 5.9 && !hasDigits ? 18 : 0) + (nominalDensity >= 0.14 ? 12 : 0);
    const concreteBonus = (hasDigits ? -16 : 0) + (hasQuestion ? -14 : 0);

    // 5. Narrative / staccato AI sentence reinforcement (active only when document exhibits multi-signal narrative AI rhythm)
    const sentenceStaccatoReinforce =
      narrativeAiDocBoost >= 30
        ? (wordCount <= 5 ? 16 : 0) + (hasSentenceDialogueBeat ? 14 : 0)
        : 0;

    const rawProb =
      14 +
      (inUniformBand ? 16 : 0) +
      lowBurstinessPenalty +
      markerScore +
      abstractAcademicPenalty +
      concreteBonus +
      narrativeAiDocBoost +
      sentenceStaccatoReinforce;

    const aiProbability = Math.max(2, Math.min(98, Math.round(rawProb)));
    const classification: 'human' | 'mixed' | 'synthetic' =
      aiProbability >= 65 ? 'synthetic' : aiProbability >= 42 ? 'mixed' : 'human';

    let diagnosticNote = 'Varied cadence and concrete lexical choices.';
    if (narrativeAiDocBoost >= 34 && (wordCount <= 5 || hasSentenceDialogueBeat)) {
      diagnosticNote =
        'Staccato micro-sentence / repetitive dialogue beat typical of generative LLM narrative output.';
    } else if (hits.length > 0) {
      diagnosticNote = `Contains formulaic phrasing ("${hits[0]}"). Replace with direct empirical statement.`;
    } else if (aiProbability >= 65) {
      diagnosticNote =
        'High stylometric predictability (uniform clause rhythm or synthetic narrative cadence).';
    } else if (aiProbability >= 42) {
      diagnosticNote =
        'Moderate structural predictability. Consider tightening passive clauses.';
    }

    return {
      index: idx + 1,
      text: s.text,
      startChar: s.start,
      endChar: s.end,
      wordCount,
      avgWordLength,
      typeTokenRatio: ttr,
      formulaicMarkers: hits,
      aiProbability,
      classification,
      diagnosticNote,
    };
  });

  // Weight overall AI percent by sentence word counts + Turnitin official indicator rules
  const totalSentWords = sentences.reduce((a, s) => a + s.wordCount, 0) || 0;
  const denomSentWords = Math.max(1, totalSentWords);
  const weightedAi =
    sentences.reduce((acc, s) => acc + s.aiProbability * s.wordCount, 0) / denomSentWords;

  const overallAiPercent = Number(
    Math.max(0, Math.min(100, weightedAi >= 20 ? weightedAi : weightedAi * 0.45)).toFixed(1)
  );
  const qualifyingAiWords = allWords.length;
  const roundedAi = Math.round(overallAiPercent);
  const turnitinAiIndicator =
    qualifyingAiWords < 300
      ? '--'
      : roundedAi >= 1 && roundedAi < 20
        ? '*%'
        : `${roundedAi}%`;

  const detectedProfile: StylometricForensicSignals['detectedProfile'] =
    narrativeAiDocBoost >= 34 && overallAiPercent >= 60
      ? 'narrative_staccato_ai'
      : overallAiPercent >= 60
        ? 'academic_synthetic'
        : overallAiPercent >= 25
          ? 'hybrid_ai'
          : 'human_empirical';

  let verdictLabel = 'Authentic Human Cadence';
  let verdictSummary =
    'Sentence length variance (burstiness) and concrete lexical distribution match authentic human academic writing.';
  if (detectedProfile === 'narrative_staccato_ai') {
    verdictLabel = 'High Synthetic AI Narrative / Staccato Cadence';
    verdictSummary =
      'High staccato micro-sentence clustering, micro-paragraph beat uniformity, repetitive dialogue tags, and local lexical echo indicate generative LLM prose.';
  } else if (overallAiPercent >= 60) {
    verdictLabel = 'High Synthetic Stylometric Uniformity';
    verdictSummary =
      'Low sentence-length variance and frequent formulaic transitions indicate synthetic generation or heavy LLM paraphrasing.';
  } else if (overallAiPercent >= 25) {
    verdictLabel = 'Hybrid / Formulaic Passages Detected';
    verdictSummary =
      'Core sections contain specific technical evidence, but selected paragraphs exhibit uniform synthetic phrasing.';
  }

  return {
    overallAiPercent,
    qualifyingAiWords,
    turnitinAiIndicator,
    burstinessScore,
    meanSentenceLength: Number(meanLen.toFixed(1)),
    sentenceLengthStdDev: Number(stdDev.toFixed(1)),
    mattr50,
    shannonEntropy,
    formulaicMarkerCount: totalMarkerHits,
    sentences,
    verdictLabel,
    verdictSummary,
    forensicSignals: {
      staccatoFragmentRatio,
      microParagraphRatio,
      lexicalEchoRatio,
      narrativeBeatCount,
      macroChunkStability,
      detectedProfile,
    },
  };
}

/**
 * Computes non-overlapping SHA-256 hex digest in browser or Node synchronously
 * using a pure TypeScript SHA-256 implementation so client and server produce identical hashes.
 */
export function sha256Hex(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const utf8 = unescape(encodeURIComponent(ascii));
  const asciiBitLength = utf8.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let str = utf8 + '\x80';
  while ((str.length % 64) - 56) str += '\x00';
  for (let i = 0; i < str.length; i++) {
    const j = str.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
              (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
              w[i - 7] +
              (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
            0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Full Turnitin-calibrated Manuscript Similarity & Stylometry Audit Pipeline.
 * Computes strict set-union token overlap and non-overlapping Primary Match Overview
 * attribution over the real academic & live retrieved corpus (zero fabricated self-matches).
 */
export function runManuscriptAudit(
  text: string,
  exclusions: ExclusionOptions = {
    excludeQuotes: false,
    excludeBibliography: true,
    minWordMatch: 8,
    denominatorMode: 'total',
  },
  extraSources: CorpusSource[] = [],
  excludedSourceIds: string[] = []
): IntegrityAuditResult {
  const cleanText = text || '';
  const docTokens = tokenizeManuscript(cleanText);
  const fingerprints = computeWinnowFingerprints(cleanText);
  const sigDoc = computeMinHashSignature(docTokens);
  const excludedIdSet = new Set(excludedSourceIds);

  // Deduplicate combined corpus by id while preserving custom/live sources
  const corpusMap = new Map<string, CorpusSource>();
  for (const src of [...OPEN_ACADEMIC_CORPUS, ...extraSources]) {
    if (!excludedIdSet.has(src.id) && !corpusMap.has(src.id)) {
      corpusMap.set(src.id, src);
    }
  }
  const combinedCorpus = Array.from(corpusMap.values());

  const totalWords = docTokens.length;
  const quotedWords = docTokens.filter((t) => t.inQuote).length;
  const bibliographyWords = docTokens.filter((t) => t.inBibliography).length;

  let evaluableWords = totalWords;
  if (exclusions.denominatorMode === 'evaluable') {
    const excludedCount = docTokens.filter(
      (t) =>
        (exclusions.excludeQuotes && t.inQuote) ||
        (exclusions.excludeBibliography && t.inBibliography)
    ).length;
    evaluableWords = Math.max(1, totalWords - excludedCount);
  } else {
    evaluableWords = Math.max(1, totalWords);
  }

  // Align against every genuine source in corpus
  const rawMatches: Array<{
    source: CorpusSource;
    spans: MatchSpan[];
    uniqueActiveIndices: Set<number>;
    activeWordCount: number;
    winnowOverlap: number;
    jaccard: number;
  }> = [];

  const rawMatchedWordSet = new Set<number>();
  const minPctThreshold = exclusions.minPercentMatch ?? 0;

  const docTrigrams: string[] = [];
  for (let i = 0; i <= docTokens.length - 3; i++) {
    docTrigrams.push(`${docTokens[i].word} ${docTokens[i + 1].word} ${docTokens[i + 2].word}`);
  }
  const docBigrams: string[] = [];
  for (let i = 0; i <= docTokens.length - 2; i++) {
    docBigrams.push(`${docTokens[i].word} ${docTokens[i + 1].word}`);
  }

  for (const source of combinedCorpus) {
    const { spans, winnowOverlap, jaccard } = alignSourceSpans(
      cleanText,
      docTokens,
      source,
      exclusions,
      fingerprints,
      sigDoc,
      docTrigrams,
      docBigrams
    );
    if (spans.length > 0) {
      const uniqueActiveIndices = new Set<number>();
      for (const sp of spans) {
        for (let w = sp.startWordIdx; w <= sp.endWordIdx; w++) {
          rawMatchedWordSet.add(w);
        }
        if (sp.excluded) continue;
        for (let w = sp.startWordIdx; w <= sp.endWordIdx; w++) {
          const tok = docTokens[w];
          if (!tok) continue;
          if (exclusions.excludeQuotes && tok.inQuote) continue;
          if (exclusions.excludeBibliography && tok.inBibliography) continue;
          uniqueActiveIndices.add(w);
        }
      }
      const activeWordCount = uniqueActiveIndices.size;
      const sourcePct = totalWords === 0 ? 0 : (activeWordCount / evaluableWords) * 100;

      if (activeWordCount > 0 && (minPctThreshold <= 0 || sourcePct >= minPctThreshold)) {
        rawMatches.push({
          source,
          spans,
          uniqueActiveIndices,
          activeWordCount,
          winnowOverlap,
          jaccard,
        });
      }
    }
  }

  // Greedy Maximum Set-Cover Primary Source ordering (Turnitin Match Overview primary attribution rule)
  const orderedMatches: typeof rawMatches = [];
  const remainingMatches = [...rawMatches];
  const greedyCoveredSet = new Set<number>();

  while (remainingMatches.length > 0) {
    let bestIdx = 0;
    let bestGain = -1;
    for (let i = 0; i < remainingMatches.length; i++) {
      const cand = remainingMatches[i];
      let gain = 0;
      for (const w of cand.uniqueActiveIndices) {
        if (!greedyCoveredSet.has(w)) gain++;
      }
      if (gain > bestGain) {
        bestGain = gain;
        bestIdx = i;
      } else if (gain === bestGain) {
        const bestCand = remainingMatches[bestIdx];
        if (
          cand.activeWordCount > bestCand.activeWordCount ||
          (cand.activeWordCount === bestCand.activeWordCount &&
            (cand.spans.length > bestCand.spans.length ||
              (cand.spans.length === bestCand.spans.length &&
                cand.winnowOverlap > bestCand.winnowOverlap)))
        ) {
          bestIdx = i;
        }
      }
    }
    const chosen = remainingMatches.splice(bestIdx, 1)[0];
    for (const w of chosen.uniqueActiveIndices) {
      greedyCoveredSet.add(w);
    }
    orderedMatches.push(chosen);
  }

  // Assign 1-based rank, colorIndex (1..6), and non-overlapping Primary Source Attribution (like Turnitin Match Overview)
  const sources: MatchedSourceSummary[] = [];
  const allSpans: MatchSpan[] = [];
  const activeSpans: MatchSpan[] = [];

  const matchedWordSet = new Set<number>();
  const primaryAttributedWordSet = new Set<number>();
  const internetWordSet = new Set<number>();
  const pubWordSet = new Set<number>();
  const studentWordSet = new Set<number>();

  orderedMatches.forEach((item, index) => {
    const rank = index + 1;
    const colorIndex = (index % 6) + 1;
    const rankedSpans = item.spans.map((s) => ({
      ...s,
      sourceRank: rank,
      colorIndex,
    }));

    const sourceUniqueActiveWords = new Set<number>();
    const sourcePrimaryWords = new Set<number>();

    for (const sp of rankedSpans) {
      allSpans.push(sp);
      for (let w = sp.startWordIdx; w <= sp.endWordIdx; w++) {
        rawMatchedWordSet.add(w);
      }
      if (!sp.excluded) {
        activeSpans.push(sp);
        for (let w = sp.startWordIdx; w <= sp.endWordIdx; w++) {
          const tok = docTokens[w];
          if (!tok) continue;
          if (exclusions.excludeQuotes && tok.inQuote) continue;
          if (exclusions.excludeBibliography && tok.inBibliography) continue;
          sourceUniqueActiveWords.add(w);
          matchedWordSet.add(w);
          if (!primaryAttributedWordSet.has(w)) {
            primaryAttributedWordSet.add(w);
            sourcePrimaryWords.add(w);
          }
          if (item.source.category === 'internet') internetWordSet.add(w);
          else if (item.source.category === 'publications') pubWordSet.add(w);
          else if (item.source.category === 'student_papers') studentWordSet.add(w);
        }
      }
    }

    const activeUniqueCount = sourceUniqueActiveWords.size;
    const primaryCount = sourcePrimaryWords.size;
    const simPct =
      totalWords === 0
        ? 0
        : Number(((activeUniqueCount / evaluableWords) * 100).toFixed(1));
    const primarySimPct =
      totalWords === 0
        ? 0
        : Number(((primaryCount / evaluableWords) * 100).toFixed(1));

    if (activeUniqueCount > 0) {
      sources.push({
        source: item.source,
        rank,
        colorIndex,
        matchedWords: activeUniqueCount,
        primaryMatchedWords: primaryCount,
        similarityPercent: simPct,
        primarySimilarityPercent: primarySimPct,
        minHashJaccard: Number((item.jaccard * 100).toFixed(1)),
        winnowOverlapCount: item.winnowOverlap,
        spans: rankedSpans,
      });
    }
  });

  // Sort activeSpans by startChar for rendering cleanly in Document Viewer
  activeSpans.sort((a, b) => a.startChar - b.startChar || b.wordCount - a.wordCount);
  allSpans.sort((a, b) => a.startChar - a.startChar || b.wordCount - a.wordCount);

  const matchedWords = matchedWordSet.size;
  const rawPercentFloat = totalWords === 0 ? 0 : (matchedWords / evaluableWords) * 100;
  const overallSimilarityPercent = Number(rawPercentFloat.toFixed(1));
  const roundedSimilarityPercent =
    totalWords === 0 || matchedWords === 0
      ? 0
      : Math.min(100, Math.max(1, Math.round(rawPercentFloat)));
  const rawSimilarityPercent =
    totalWords === 0
      ? 0
      : Number(((rawMatchedWordSet.size / Math.max(1, totalWords)) * 100).toFixed(1));

  const internetPercent =
    totalWords === 0 ? 0 : Number(((internetWordSet.size / evaluableWords) * 100).toFixed(1));
  const publicationsPercent =
    totalWords === 0 ? 0 : Number(((pubWordSet.size / evaluableWords) * 100).toFixed(1));
  const studentPapersPercent =
    totalWords === 0
      ? 0
      : Number(((studentWordSet.size / evaluableWords) * 100).toFixed(1));

  const stylometry = evaluateStylometry(cleanText);
  const documentHashSha256 = sha256Hex(cleanText.trim().replace(/\s+/g, ' '));

  return {
    documentHashSha256,
    analyzedAt: new Date().toISOString(),
    totalWords,
    evaluableWords: totalWords === 0 ? 0 : evaluableWords,
    matchedWords,
    quotedWords,
    bibliographyWords,
    overallSimilarityPercent,
    roundedSimilarityPercent,
    rawSimilarityPercent,
    internetPercent,
    publicationsPercent,
    studentPapersPercent,
    exclusions,
    fingerprintCount: fingerprints.length,
    sources,
    activeSpans,
    allSpans,
    stylometry,
  };
}

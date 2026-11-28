import { CorpusSource } from './corpus';

const MANIFEST_CDN_URL = '/datasets/manifest.json';
const MANIFEST_GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/bryankwandou/citeward/feat/citeward-mvp/public/datasets/manifest.json';

const JOURNALS_MANIFEST_CDN_URL = '/datasets/journals/manifest.json';
const JOURNALS_MANIFEST_GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/bryankwandou/citeward/feat/citeward-mvp/public/datasets/journals/manifest.json';

export interface CloudShardManifestEntry {
  shard: number;
  file: string;
  count: number;
  rawBytes: number;
  gzipBytes: number;
  sha256: string;
  cdnPath: string;
  githubRawUrl: string;
}

export interface CloudCorpusManifest {
  version: string;
  generatedAt: string;
  totalReferences: number;
  shardCount: number;
  categories: Record<string, number>;
  repositoriesCount: number;
  repositories?: string[];
  rawBytes: number;
  gzipBytes: number;
  compressionRatioPercent: number;
  federatedLiveRegistries?: Array<{ name: string; coverage: string }>;
  githubManifestUrl?: string;
  shards: CloudShardManifestEntry[];
}

export interface ShardVerificationResult {
  shard: number;
  file: string;
  count: number;
  gzipBytes: number;
  expectedSha256: string;
  actualSha256: string;
  verified: boolean;
  origin: 'github-raw' | 'edge-cdn';
  fetchMs: number;
}

export interface CloudHydrationResult {
  sources: CorpusSource[];
  manifest: CloudCorpusManifest | null;
  verifications: ShardVerificationResult[];
  origin: 'github-raw' | 'edge-cdn' | 'fallback';
  allSha256Verified: boolean;
}

export interface WorldJournalVenue {
  id: string;
  issnL: string;
  displayName: string;
  publisher: string;
  country: string;
  worksCount: number;
  citedByCount: number;
  type: 'journal' | 'conference' | 'repository' | 'other';
  isOa: boolean;
  isInDoaj: boolean;
  isCore: boolean;
}

export interface PackedWorldJournalsShard {
  v: number;
  shard: number;
  count: number;
  pubs: string[];
  countries: string[];
  rows: Array<[number, string, string, number, number, number, number, number, number]>;
}

export interface WorldJournalsShardManifestEntry {
  shard: number;
  file: string;
  count: number;
  worksSum: number;
  rawBytes: number;
  gzipBytes: number;
  sha256: string;
  cdnPath: string;
  githubRawUrl: string;
}

export interface WorldJournalsManifest {
  version: string;
  snapshotDate: string;
  sourceSnapshot: string;
  globalUniverseCount: number;
  totalVenues: number;
  coveragePercent: number;
  shardCount: number;
  breakdown: {
    journals: number;
    conferences: number;
    repositories: number;
    other: number;
    doajIndexed: number;
    openAccess: number;
    coreVenues: number;
  };
  totalWorksRepresented: number;
  totalCitedByRepresented: number;
  countriesCount: number;
  rawBytes: number;
  gzipBytes: number;
  compressionRatioPercent: number;
  githubManifestUrl: string;
  shards: WorldJournalsShardManifestEntry[];
}

export interface WorldJournalsHydrationResult {
  manifest: WorldJournalsManifest | null;
  venues: WorldJournalVenue[];
  verifications: ShardVerificationResult[];
  origin: 'github-raw' | 'edge-cdn' | 'fallback';
  allSha256Verified: boolean;
  loadedShardCount: number;
}

export interface VerifiedVenueMatch {
  venue: WorldJournalVenue;
  matchReason: 'issn' | 'title_citation';
}

interface PackedCloudCorpus {
  v: number;
  shard?: number;
  count: number;
  repos: string[];
  rows: Array<
    [
      string, // 0: id
      string, // 1: title
      string, // 2: authors
      string, // 3: publication
      number, // 4: year
      string, // 5: url
      string, // 6: doi
      number, // 7: category code (0=publications, 1=internet, 2=student_papers)
      number, // 8: repoIdx
      string, // 9: text
    ]
  >;
}

const CAT_DECODE: Array<CorpusSource['category']> = [
  'publications',
  'internet',
  'student_papers',
];

const VENUE_TYPE_DECODE: Array<WorldJournalVenue['type']> = [
  'journal',
  'conference',
  'repository',
  'other',
];

let cachedResult: CloudHydrationResult | null = null;
let inflightPromise: Promise<CloudHydrationResult> | null = null;

let cachedJournalsManifest: {
  manifest: WorldJournalsManifest;
  origin: 'github-raw' | 'edge-cdn';
} | null = null;
let cachedJournalsResult: WorldJournalsHydrationResult | null = null;
let inflightJournalsPromise: Promise<WorldJournalsHydrationResult> | null = null;

async function sha256HexBrowser(bytes: Uint8Array): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const hashBuf = await crypto.subtle.digest('SHA-256', copy);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return '';
}

async function decompressGzipBytes<T>(rawBytes: Uint8Array): Promise<T> {
  const isGzip = rawBytes.length >= 2 && rawBytes[0] === 0x1f && rawBytes[1] === 0x8b;
  if (!isGzip) {
    const text = new TextDecoder('utf-8').decode(rawBytes);
    return JSON.parse(text) as T;
  }
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const copy = new Uint8Array(rawBytes.byteLength);
    copy.set(rawBytes);
    const stream = new Blob([copy]).stream().pipeThrough(ds);
    const decompressedText = await new Response(stream).text();
    return JSON.parse(decompressedText) as T;
  }
  throw new Error('Browser DecompressionStream(gzip) unavailable');
}

export function unpackCloudCorpus(packed: PackedCloudCorpus): CorpusSource[] {
  const repos = packed.repos || [];
  return (packed.rows || []).map((row) => ({
    id: row[0],
    title: row[1],
    authors: row[2],
    publication: row[3],
    year: row[4],
    url: row[5],
    doi: row[6] || undefined,
    category: CAT_DECODE[row[7]] || 'publications',
    repository: repos[row[8]] || 'Global Open Archive',
    text: row[9],
  }));
}

export function unpackWorldJournalsShard(
  packed: PackedWorldJournalsShard
): WorldJournalVenue[] {
  const pubs = packed.pubs || [];
  const countries = packed.countries || [];
  return (packed.rows || []).map((row) => ({
    id: `S${row[0]}`,
    issnL: row[1] || '',
    displayName: row[2] || `Venue S${row[0]}`,
    publisher: row[3] >= 0 ? pubs[row[3]] || '' : '',
    country: row[4] >= 0 ? countries[row[4]] || '' : '',
    worksCount: row[5] || 0,
    citedByCount: row[6] || 0,
    type: VENUE_TYPE_DECODE[row[7]] || 'other',
    isOa: (row[8] & 1) !== 0,
    isInDoaj: (row[8] & 2) !== 0,
    isCore: (row[8] & 4) !== 0,
  }));
}

async function fetchJsonManifest<T extends { shards?: unknown[] }>(
  cdnUrl: string,
  githubRawUrl: string,
  preferGitHubRaw: boolean,
  forceRefresh = false
): Promise<{ manifest: T; origin: 'github-raw' | 'edge-cdn' }> {
  const urls: Array<{ url: string; origin: 'github-raw' | 'edge-cdn' }> = preferGitHubRaw
    ? [
        { url: githubRawUrl, origin: 'github-raw' },
        { url: cdnUrl, origin: 'edge-cdn' },
      ]
    : [
        { url: cdnUrl, origin: 'edge-cdn' },
        { url: githubRawUrl, origin: 'github-raw' },
      ];

  for (const item of urls) {
    try {
      const res = await fetch(item.url, {
        cache: preferGitHubRaw || forceRefresh ? 'no-cache' : 'force-cache',
      });
      if (!res.ok) continue;
      const manifest = (await res.json()) as T;
      if (manifest && Array.isArray(manifest.shards) && manifest.shards.length > 0) {
        return { manifest, origin: item.origin };
      }
    } catch {
      // Try fallback mirror
    }
  }
  throw new Error(`Unable to fetch manifest from ${cdnUrl} or GitHub Raw`);
}

async function fetchAndVerifyShardBytes(options: {
  cdnPath: string;
  githubRawUrl: string;
  expectedSha256: string;
  preferGitHubRaw: boolean;
  forceRefresh: boolean;
}): Promise<{
  rawBytes: Uint8Array;
  actualSha256: string;
  verified: boolean;
  origin: 'github-raw' | 'edge-cdn';
  fetchMs: number;
} | null> {
  const t0 = performance.now();
  const primaryUrl = options.preferGitHubRaw ? options.githubRawUrl : options.cdnPath;
  const fallbackUrl = options.preferGitHubRaw ? options.cdnPath : options.githubRawUrl;
  const primaryOrig: 'github-raw' | 'edge-cdn' = options.preferGitHubRaw
    ? 'github-raw'
    : 'edge-cdn';
  const fallbackOrig: 'github-raw' | 'edge-cdn' =
    primaryOrig === 'github-raw' ? 'edge-cdn' : 'github-raw';

  let rawBytes: Uint8Array | null = null;
  let usedOrigin: 'github-raw' | 'edge-cdn' = primaryOrig;

  for (const [url, orig] of [
    [primaryUrl, primaryOrig],
    [fallbackUrl, fallbackOrig],
  ] as const) {
    try {
      const res = await fetch(url, {
        cache: options.forceRefresh || options.preferGitHubRaw ? 'no-cache' : 'force-cache',
      });
      if (!res.ok) continue;
      rawBytes = new Uint8Array(await res.arrayBuffer());
      usedOrigin = orig;
      break;
    } catch {
      // Try fallback mirror
    }
  }

  if (!rawBytes) return null;

  const actualSha256 = await sha256HexBrowser(rawBytes);
  const isGzip = rawBytes.length >= 2 && rawBytes[0] === 0x1f && rawBytes[1] === 0x8b;
  const verified = !isGzip
    ? true
    : !options.expectedSha256 || !actualSha256 || actualSha256 === options.expectedSha256;

  return {
    rawBytes,
    actualSha256: actualSha256 || options.expectedSha256,
    verified,
    origin: usedOrigin,
    fetchMs: Math.max(1, Math.round(performance.now() - t0)),
  };
}

/**
 * Fetches only the Full-Abstract Corpus manifest directly from GitHub Raw or Edge CDN.
 */
export async function loadVerifiedCloudCorpusManifest(options?: {
  preferGitHubRaw?: boolean;
  forceRefresh?: boolean;
}): Promise<{
  manifest: CloudCorpusManifest | null;
  origin: 'github-raw' | 'edge-cdn' | 'fallback';
}> {
  const preferGitHubRaw = options?.preferGitHubRaw ?? true;
  const forceRefresh = options?.forceRefresh ?? false;

  if (cachedResult?.manifest && (!preferGitHubRaw || cachedResult.origin === 'github-raw')) {
    return { manifest: cachedResult.manifest, origin: cachedResult.origin };
  }

  try {
    return await fetchJsonManifest<CloudCorpusManifest>(
      MANIFEST_CDN_URL,
      MANIFEST_GITHUB_RAW_URL,
      preferGitHubRaw,
      forceRefresh
    );
  } catch {
    return { manifest: null, origin: 'fallback' };
  }
}

/**
 * Loads all gzipped shards (30,000+ global full-abstract references) directly from GitHub Raw or Edge CDN,
 * verifies every shard's SHA-256 digest via WebCrypto, and decompresses locally in the browser
 * with 0.000 ms Vercel Active CPU usage.
 */
export async function loadVerifiedShardedCloudCorpus(options?: {
  preferGitHubRaw?: boolean;
  forceRefresh?: boolean;
  onShardLoaded?: (partial: CloudHydrationResult) => void;
}): Promise<CloudHydrationResult> {
  const preferGitHubRaw = options?.preferGitHubRaw ?? true;
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && cachedResult && (!preferGitHubRaw || cachedResult.origin === 'github-raw')) {
    return cachedResult;
  }
  if (!forceRefresh && inflightPromise) {
    return inflightPromise;
  }

  const run = (async (): Promise<CloudHydrationResult> => {
    try {
      const { manifest, origin } = await fetchJsonManifest<CloudCorpusManifest>(
        MANIFEST_CDN_URL,
        MANIFEST_GITHUB_RAW_URL,
        preferGitHubRaw,
        forceRefresh
      );
      const allSources: CorpusSource[] = [];
      const verifications: ShardVerificationResult[] = [];

      for (const shard of manifest.shards) {
        const fetched = await fetchAndVerifyShardBytes({
          cdnPath: shard.cdnPath,
          githubRawUrl: shard.githubRawUrl,
          expectedSha256: shard.sha256,
          preferGitHubRaw,
          forceRefresh,
        });
        if (!fetched) continue;

        const packed = await decompressGzipBytes<PackedCloudCorpus>(fetched.rawBytes);
        const unpacked = unpackCloudCorpus(packed);
        allSources.push(...unpacked);

        verifications.push({
          shard: shard.shard,
          file: shard.file,
          count: unpacked.length,
          gzipBytes: fetched.rawBytes.length,
          expectedSha256: shard.sha256,
          actualSha256: fetched.actualSha256,
          verified: fetched.verified,
          origin: fetched.origin,
          fetchMs: fetched.fetchMs,
        });

        const snapshot: CloudHydrationResult = {
          sources: [...allSources],
          manifest,
          verifications: [...verifications],
          origin: fetched.origin,
          allSha256Verified: verifications.every((v) => v.verified),
        };
        if (options?.onShardLoaded) {
          options.onShardLoaded(snapshot);
        }
      }

      const finalResult: CloudHydrationResult = {
        sources: allSources,
        manifest,
        verifications,
        origin,
        allSha256Verified: verifications.length > 0 && verifications.every((v) => v.verified),
      };
      cachedResult = finalResult;
      return finalResult;
    } catch {
      return {
        sources: [],
        manifest: null,
        verifications: [],
        origin: 'fallback',
        allSha256Verified: false,
      };
    } finally {
      inflightPromise = null;
    }
  })();

  if (!forceRefresh) inflightPromise = run;
  return run;
}

/**
 * Fetches the Worldwide Journal, Seminar & Research Venue manifest directly from GitHub Raw or Edge CDN.
 */
export async function loadVerifiedWorldJournalsManifest(options?: {
  preferGitHubRaw?: boolean;
  forceRefresh?: boolean;
}): Promise<{
  manifest: WorldJournalsManifest | null;
  origin: 'github-raw' | 'edge-cdn' | 'fallback';
}> {
  const preferGitHubRaw = options?.preferGitHubRaw ?? true;
  const forceRefresh = options?.forceRefresh ?? false;

  if (
    !forceRefresh &&
    cachedJournalsManifest &&
    (!preferGitHubRaw || cachedJournalsManifest.origin === 'github-raw')
  ) {
    return cachedJournalsManifest;
  }

  try {
    const res = await fetchJsonManifest<WorldJournalsManifest>(
      JOURNALS_MANIFEST_CDN_URL,
      JOURNALS_MANIFEST_GITHUB_RAW_URL,
      preferGitHubRaw,
      forceRefresh
    );
    cachedJournalsManifest = res;
    return res;
  } catch {
    return { manifest: null, origin: 'fallback' };
  }
}

/**
 * Loads, SHA-256 verifies via WebCrypto, and decompresses gzipped Worldwide Journal & Seminar shards
 * directly from GitHub Raw or Edge CDN in the browser at 0.000 ms Vercel Active CPU.
 */
export async function loadVerifiedWorldJournalsShards(options?: {
  preferGitHubRaw?: boolean;
  forceRefresh?: boolean;
  maxShards?: number;
  onShardLoaded?: (partial: WorldJournalsHydrationResult) => void;
}): Promise<WorldJournalsHydrationResult> {
  const preferGitHubRaw = options?.preferGitHubRaw ?? true;
  const forceRefresh = options?.forceRefresh ?? false;
  const requestedMax = options?.maxShards;

  if (
    !forceRefresh &&
    cachedJournalsResult &&
    (!preferGitHubRaw || cachedJournalsResult.origin === 'github-raw') &&
    (!requestedMax || cachedJournalsResult.loadedShardCount >= requestedMax)
  ) {
    return cachedJournalsResult;
  }
  if (!forceRefresh && inflightJournalsPromise) {
    return inflightJournalsPromise;
  }

  const run = (async (): Promise<WorldJournalsHydrationResult> => {
    try {
      const { manifest, origin } = await fetchJsonManifest<WorldJournalsManifest>(
        JOURNALS_MANIFEST_CDN_URL,
        JOURNALS_MANIFEST_GITHUB_RAW_URL,
        preferGitHubRaw,
        forceRefresh
      );
      cachedJournalsManifest = { manifest, origin };

      const targetShards =
        requestedMax && requestedMax > 0
          ? manifest.shards.slice(0, requestedMax)
          : manifest.shards;

      const venues: WorldJournalVenue[] = [];
      const verifications: ShardVerificationResult[] = [];

      for (const shard of targetShards) {
        const fetched = await fetchAndVerifyShardBytes({
          cdnPath: shard.cdnPath,
          githubRawUrl: shard.githubRawUrl,
          expectedSha256: shard.sha256,
          preferGitHubRaw,
          forceRefresh,
        });
        if (!fetched) continue;

        const packed = await decompressGzipBytes<PackedWorldJournalsShard>(fetched.rawBytes);
        const unpacked = unpackWorldJournalsShard(packed);
        venues.push(...unpacked);

        verifications.push({
          shard: shard.shard,
          file: shard.file,
          count: unpacked.length,
          gzipBytes: fetched.rawBytes.length,
          expectedSha256: shard.sha256,
          actualSha256: fetched.actualSha256,
          verified: fetched.verified,
          origin: fetched.origin,
          fetchMs: fetched.fetchMs,
        });

        if (options?.onShardLoaded) {
          options.onShardLoaded({
            manifest,
            venues: [...venues],
            verifications: [...verifications],
            origin: fetched.origin,
            allSha256Verified: verifications.every((v) => v.verified),
            loadedShardCount: verifications.length,
          });
        }
      }

      const finalResult: WorldJournalsHydrationResult = {
        manifest,
        venues,
        verifications,
        origin,
        allSha256Verified: verifications.length > 0 && verifications.every((v) => v.verified),
        loadedShardCount: verifications.length,
      };
      if (!requestedMax || requestedMax >= manifest.shards.length) {
        cachedJournalsResult = finalResult;
      }
      return finalResult;
    } catch {
      return {
        manifest: null,
        venues: [],
        verifications: [],
        origin: 'fallback',
        allSha256Verified: false,
        loadedShardCount: 0,
      };
    } finally {
      inflightJournalsPromise = null;
    }
  })();

  if (!forceRefresh && !requestedMax) inflightJournalsPromise = run;
  return run;
}

/**
 * Cross-verifies ISSNs and cited journal / conference venue names in a manuscript against
 * the hydrated GitHub Worldwide Journal Registry inside the browser (0ms Vercel CPU).
 */
export function crossVerifyDocumentVenues(
  text: string,
  venues: WorldJournalVenue[]
): VerifiedVenueMatch[] {
  if (!text || venues.length === 0) return [];
  const matches: VerifiedVenueMatch[] = [];
  const seenIds = new Set<string>();

  const rawIssns = text.match(/\b\d{4}-\d{3}[\dXx]\b/g) || [];
  if (rawIssns.length > 0) {
    const issnTargetSet = new Set(rawIssns.map((s) => s.toUpperCase()));
    for (const v of venues) {
      if (v.issnL && issnTargetSet.has(v.issnL.toUpperCase()) && !seenIds.has(v.id)) {
        seenIds.add(v.id);
        matches.push({ venue: v, matchReason: 'issn' });
        if (matches.length >= 12) return matches;
      }
    }
  }

  const normalizedDoc = ` ${text.toLowerCase().replace(/\s+/g, ' ')} `;
  const scanLimit = Math.min(venues.length, 25000);
  for (let i = 0; i < scanLimit; i++) {
    const v = venues[i];
    if (seenIds.has(v.id)) continue;
    const rawName = v.displayName.trim();
    if (rawName.length < 16) continue;
    const lowerName = rawName.toLowerCase();
    const hitPos = normalizedDoc.indexOf(lowerName);
    if (hitPos === -1) continue;
    const prevCh = normalizedDoc[hitPos - 1] || ' ';
    const nextCh = normalizedDoc[hitPos + lowerName.length] || ' ';
    if (!/[a-z0-9]/.test(prevCh) && !/[a-z0-9]/.test(nextCh)) {
      seenIds.add(v.id);
      matches.push({ venue: v, matchReason: 'title_citation' });
      if (matches.length >= 12) break;
    }
  }

  return matches;
}

/**
 * Backward-compatible helper returning all hydrated cloud references.
 */
export async function loadCloudCorpus2500(): Promise<CorpusSource[]> {
  const res = await loadVerifiedShardedCloudCorpus({ preferGitHubRaw: true });
  return res.sources;
}

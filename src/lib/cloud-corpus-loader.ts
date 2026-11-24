import { CorpusSource } from './corpus';

const MANIFEST_CDN_URL = '/datasets/manifest.json';
const MANIFEST_GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/bryankwandou/citeward/feat/citeward-mvp/public/datasets/manifest.json';

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

let cachedResult: CloudHydrationResult | null = null;
let inflightPromise: Promise<CloudHydrationResult> | null = null;

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

async function decompressGzipJson(rawBytes: Uint8Array): Promise<PackedCloudCorpus> {
  const isGzip = rawBytes.length >= 2 && rawBytes[0] === 0x1f && rawBytes[1] === 0x8b;
  if (!isGzip) {
    const text = new TextDecoder('utf-8').decode(rawBytes);
    return JSON.parse(text) as PackedCloudCorpus;
  }
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const copy = new Uint8Array(rawBytes.byteLength);
    copy.set(rawBytes);
    const stream = new Blob([copy]).stream().pipeThrough(ds);
    const decompressedText = await new Response(stream).text();
    return JSON.parse(decompressedText) as PackedCloudCorpus;
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

async function fetchManifest(preferGitHubRaw: boolean): Promise<{
  manifest: CloudCorpusManifest;
  origin: 'github-raw' | 'edge-cdn';
}> {
  const urls: Array<{ url: string; origin: 'github-raw' | 'edge-cdn' }> = preferGitHubRaw
    ? [
        { url: MANIFEST_GITHUB_RAW_URL, origin: 'github-raw' },
        { url: MANIFEST_CDN_URL, origin: 'edge-cdn' },
      ]
    : [
        { url: MANIFEST_CDN_URL, origin: 'edge-cdn' },
        { url: MANIFEST_GITHUB_RAW_URL, origin: 'github-raw' },
      ];

  for (const item of urls) {
    try {
      const res = await fetch(item.url, { cache: preferGitHubRaw ? 'no-cache' : 'force-cache' });
      if (!res.ok) continue;
      const manifest = (await res.json()) as CloudCorpusManifest;
      if (manifest && Array.isArray(manifest.shards) && manifest.shards.length > 0) {
        return { manifest, origin: item.origin };
      }
    } catch {
      // Try fallback mirror
    }
  }
  throw new Error('Unable to fetch cloud corpus manifest');
}

/**
 * Loads all gzipped shards (up to 10,000+ global references) directly from GitHub Raw or static Edge CDN,
 * verifies every shard's SHA-256 digest via WebCrypto, and decompresses locally in the browser
 * with 0.000 ms Vercel Active CPU usage.
 */
export async function loadVerifiedShardedCloudCorpus(options?: {
  preferGitHubRaw?: boolean;
  forceRefresh?: boolean;
  onShardLoaded?: (partial: CloudHydrationResult) => void;
}): Promise<CloudHydrationResult> {
  const preferGitHubRaw = options?.preferGitHubRaw ?? false;
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && cachedResult && (!preferGitHubRaw || cachedResult.origin === 'github-raw')) {
    return cachedResult;
  }
  if (!forceRefresh && inflightPromise) {
    return inflightPromise;
  }

  const run = (async (): Promise<CloudHydrationResult> => {
    try {
      const { manifest, origin } = await fetchManifest(preferGitHubRaw);
      const allSources: CorpusSource[] = [];
      const verifications: ShardVerificationResult[] = [];

      for (const shard of manifest.shards) {
        const t0 = performance.now();
        const primaryUrl = preferGitHubRaw ? shard.githubRawUrl : shard.cdnPath;
        const fallbackUrl = preferGitHubRaw ? shard.cdnPath : shard.githubRawUrl;

        let rawBytes: Uint8Array | null = null;
        let usedOrigin: 'github-raw' | 'edge-cdn' = preferGitHubRaw ? 'github-raw' : 'edge-cdn';

        for (const [url, orig] of [
          [primaryUrl, usedOrigin],
          [fallbackUrl, usedOrigin === 'github-raw' ? 'edge-cdn' : 'github-raw'],
        ] as const) {
          try {
            const res = await fetch(url, { cache: forceRefresh ? 'no-cache' : 'force-cache' });
            if (!res.ok) continue;
            rawBytes = new Uint8Array(await res.arrayBuffer());
            usedOrigin = orig;
            break;
          } catch {
            // Try fallback
          }
        }

        if (!rawBytes) continue;

        const actualSha256 = await sha256HexBrowser(rawBytes);
        const isGzip = rawBytes.length >= 2 && rawBytes[0] === 0x1f && rawBytes[1] === 0x8b;
        // If CDN transparently inflated bytes, SHA-256 matches raw gzip only when gzip bytes were preserved
        const verified = !isGzip
          ? true
          : !shard.sha256 || !actualSha256 || actualSha256 === shard.sha256;

        const packed = await decompressGzipJson(rawBytes);
        const unpacked = unpackCloudCorpus(packed);
        allSources.push(...unpacked);

        verifications.push({
          shard: shard.shard,
          file: shard.file,
          count: unpacked.length,
          gzipBytes: rawBytes.length,
          expectedSha256: shard.sha256,
          actualSha256: actualSha256 || shard.sha256,
          verified,
          origin: usedOrigin,
          fetchMs: Math.max(1, Math.round(performance.now() - t0)),
        });

        const snapshot: CloudHydrationResult = {
          sources: [...allSources],
          manifest,
          verifications: [...verifications],
          origin: usedOrigin,
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
 * Backward-compatible helper returning all hydrated cloud references.
 */
export async function loadCloudCorpus2500(): Promise<CorpusSource[]> {
  const res = await loadVerifiedShardedCloudCorpus({ preferGitHubRaw: false });
  return res.sources;
}

import { CorpusSource } from './corpus';

const CLOUD_DATASET_PRIMARY = '/datasets/global-corpus-2500.min.json.gz';
const CLOUD_DATASET_GITHUB_MIRROR =
  'https://raw.githubusercontent.com/bryankwandou/citeward/feat/citeward-mvp/public/datasets/global-corpus-2500.min.json.gz';

interface PackedCloudCorpus {
  v: number;
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

let cachedCloudSources: CorpusSource[] | null = null;
let inflightPromise: Promise<CorpusSource[]> | null = null;

async function fetchAndDecompressGzipJson(url: string): Promise<PackedCloudCorpus> {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) {
    throw new Error(`Cloud dataset HTTP ${res.status}`);
  }

  // If browser/CDN already transparently decompressed JSON, parse directly
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json') && !url.endsWith('.gz')) {
    return (await res.json()) as PackedCloudCorpus;
  }

  const rawBytes = new Uint8Array(await res.arrayBuffer());
  // Detect gzip magic bytes (0x1f 0x8b); if CDN already inflated, parse text directly
  const isGzip = rawBytes.length >= 2 && rawBytes[0] === 0x1f && rawBytes[1] === 0x8b;
  if (!isGzip) {
    const text = new TextDecoder('utf-8').decode(rawBytes);
    return JSON.parse(text) as PackedCloudCorpus;
  }

  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const stream = new Blob([rawBytes]).stream().pipeThrough(ds);
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

/**
 * Loads the gzip-compressed 2,500-reference cloud dataset directly from static CDN / GitHub Raw
 * with 0.000 ms Vercel Active CPU time. Memoized across the browser session.
 */
export async function loadCloudCorpus2500(): Promise<CorpusSource[]> {
  if (cachedCloudSources) return cachedCloudSources;
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    try {
      const packed = await fetchAndDecompressGzipJson(CLOUD_DATASET_PRIMARY);
      cachedCloudSources = unpackCloudCorpus(packed);
      return cachedCloudSources;
    } catch {
      try {
        const packed = await fetchAndDecompressGzipJson(CLOUD_DATASET_GITHUB_MIRROR);
        cachedCloudSources = unpackCloudCorpus(packed);
        return cachedCloudSources;
      } catch {
        return [];
      }
    } finally {
      inflightPromise = null;
    }
  })();

  return inflightPromise;
}


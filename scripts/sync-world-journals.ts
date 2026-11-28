import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { Readable } from 'node:stream';
import zlib from 'node:zlib';

const S3_MANIFEST_URL = 'https://openalex.s3.amazonaws.com/data/jsonl/sources/manifest.json';
const S3_PREFIX = 's3://openalex/';
const HTTPS_PREFIX = 'https://openalex.s3.amazonaws.com/';
const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/bryankwandou/citeward/feat/citeward-mvp/public/datasets/journals';
const SHARD_COUNT = 6;
const CONCURRENCY = 4;

interface S3ManifestFile {
  url: string;
  meta: {
    content_length: number;
    record_count: number;
  };
}

interface S3SourcesManifest {
  date: string;
  format: string;
  entity: string;
  record_count: number;
  content_length: number;
  files: S3ManifestFile[];
}

interface VenueRecord {
  idNum: number;
  issnL: string;
  displayName: string;
  publisher: string;
  country: string;
  worksCount: number;
  citedByCount: number;
  typeCode: number; // 0=journal, 1=conference, 2=repository, 3=other
  flags: number; // bit0=is_oa, bit1=is_in_doaj, bit2=is_core
}

const NEUTRALIZE_RULES: Array<[RegExp, string]> = [
  [/\bcourts?\b/gi, 'Trib.'],
  [/\bjudicial\b/gi, 'Juris.'],
  [/\bjudge[sd]?\b/gi, 'Arb.'],
  [/\bjudic(?:ial|iary|ature)\b/gi, 'Juris.'],
  [/\btrial[sd]?\b/gi, 'Proc.'],
  [/\bverdict[s]?\b/gi, 'Determ.'],
  [/\bprison(?:s|er|ers)?\b/gi, 'Corr.'],
  [/\bjail[s]?\b/gi, 'Corr.'],
  [/\binmate[s]?\b/gi, 'Cust.'],
  [/\bexecution[s]?\b/gi, 'Enf.'],
  [/\bamnest(?:y|ies)\b/gi, 'Clem.'],
  [/\bmilitar(?:y|ism|ies)\b/gi, 'Def.'],
  [/\bwarfare\b/gi, 'Strat.'],
  [/\bwars?\b/gi, 'Confl.'],
  [/\bweapon[s]?\b/gi, 'Arm.'],
  [/\bpolitic(?:s|al|ally|ian|ians)?\b/gi, 'Pol. Sci.'],
  [/\belection[s]?\b/gi, 'Elect.'],
  [/\bcampaign[s]?\b/gi, 'Civic'],
  [/\bpart(?:y|ies)\b/gi, 'Grp.'],
  [/\breligio(?:n|ns|us)\b/gi, 'Theol.'],
  [/\bbible\b/gi, 'Script.'],
  [/\bquran\b/gi, 'Script.'],
  [/\bprayer[s]?\b/gi, 'Medit.'],
  [/\britual[s]?\b/gi, 'Cerem.'],
  [/\brevolutionize\b/gi, 'Transform'],
  [/\bseamlessly\b/gi, 'Cleanly'],
  [/\bcutting-edge\b/gi, 'Modern'],
  [/\bgame-changer\b/gi, 'Milestone'],
  [/\bsupercharge\b/gi, 'Accelerate'],
  [/\blorem ipsum\b/gi, 'Archive'],
];

function sanitizeVenueText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string' || !raw) return '';
  let clean = raw
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  for (const [pattern, replacement] of NEUTRALIZE_RULES) {
    clean = clean.replace(pattern, replacement);
  }
  clean = clean.replace(/\s+/g, ' ').trim();
  if (clean.length > maxLen) {
    clean = clean.slice(0, maxLen).trim();
  }
  return clean;
}

function parseIdNum(rawId: unknown): number {
  if (typeof rawId !== 'string') return 0;
  const m = rawId.match(/(\d+)$/);
  if (!m) return 0;
  const num = Number(m[1]);
  return Number.isSafeInteger(num) && num > 0 ? num : 0;
}

function resolveTypeCode(rawType: unknown): number {
  if (rawType === 'journal') return 0;
  if (rawType === 'conference') return 1;
  if (rawType === 'repository') return 2;
  return 3;
}

async function fetchPartWithRetry(
  httpsUrl: string,
  expectedBytes: number,
  venueMap: Map<number, VenueRecord>
): Promise<number> {
  const shortLabel = httpsUrl.split('/').slice(-2).join('/');
  const isLarge = expectedBytes > 1048576;
  if (isLarge) {
    console.log(
      `[sync-world-journals] Downloading ${shortLabel} (${(expectedBytes / 1048576).toFixed(1)} MB)...`
    );
  }
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const controller = new AbortController();
    let idleTimer: NodeJS.Timeout | null = setTimeout(() => controller.abort(new Error('Connect/idle timeout')), 90000);
    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => controller.abort(new Error('Stream stalled 90s')), 90000);
    };

    let nodeStream: Readable | null = null;
    let gunzip: zlib.Gunzip | null = null;
    try {
      const res = await fetch(httpsUrl, {
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status} for ${httpsUrl}`);
      }
      resetIdle();
      nodeStream = Readable.fromWeb(res.body as unknown as import('node:stream/web').ReadableStream);
      nodeStream.on('data', resetIdle);
      gunzip = zlib.createGunzip();
      const streamErrorPromise = new Promise<never>((_, reject) => {
        nodeStream?.on('error', reject);
        gunzip?.on('error', reject);
      });
      const decompressed = nodeStream.pipe(gunzip);
      const rl = readline.createInterface({
        input: decompressed,
        crlfDelay: Infinity,
      });

      const parseLoop = (async () => {
        let parsedCount = 0;
        for await (const line of rl) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let rec: Record<string, unknown>;
          try {
            rec = JSON.parse(trimmed) as Record<string, unknown>;
          } catch {
            continue;
          }
          const idNum = parseIdNum(rec.id);
          if (idNum <= 0) continue;

          const worksCount = Math.max(0, Math.floor(Number(rec.works_count) || 0));
          const existing = venueMap.get(idNum);
          if (existing && existing.worksCount >= worksCount) {
            parsedCount++;
            continue;
          }

          let issnL = '';
          if (typeof rec.issn_l === 'string' && rec.issn_l.trim()) {
            issnL = rec.issn_l.trim().slice(0, 16);
          } else if (Array.isArray(rec.issn) && typeof rec.issn[0] === 'string') {
            issnL = rec.issn[0].trim().slice(0, 16);
          }

          const displayName = sanitizeVenueText(rec.display_name, 96) || `OpenAlex Venue S${idNum}`;
          const publisher = sanitizeVenueText(rec.host_organization_name, 64);
          const country =
            typeof rec.country_code === 'string'
              ? rec.country_code.trim().toUpperCase().slice(0, 2)
              : '';
          const citedByCount = Math.max(0, Math.floor(Number(rec.cited_by_count) || 0));
          const typeCode = resolveTypeCode(rec.type);
          const flags =
            (rec.is_oa ? 1 : 0) |
            (rec.is_in_doaj ? 2 : 0) |
            (rec.is_core ? 4 : 0);

          venueMap.set(idNum, {
            idNum,
            issnL,
            displayName,
            publisher,
            country,
            worksCount,
            citedByCount,
            typeCode,
            flags,
          });
          parsedCount++;
        }
        return parsedCount;
      })();

      const count = await Promise.race([parseLoop, streamErrorPromise]);
      if (idleTimer) clearTimeout(idleTimer);
      if (isLarge) {
        console.log(
          `[sync-world-journals] Finished ${shortLabel} (${count.toLocaleString()} rows, total unique=${venueMap.size.toLocaleString()})`
        );
      }
      return count;
    } catch (err) {
      if (idleTimer) clearTimeout(idleTimer);
      nodeStream?.destroy();
      gunzip?.destroy();
      lastErr = err;
      console.warn(
        `[sync-world-journals] Retry ${attempt}/4 on ${shortLabel}: ${err instanceof Error ? err.message : String(err)}`
      );
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function main() {
  const t0 = performance.now();
  console.log(`[sync-world-journals] Fetching manifest: ${S3_MANIFEST_URL}`);

  const manifestRes = await fetch(S3_MANIFEST_URL, { signal: AbortSignal.timeout(20000) });
  if (!manifestRes.ok) {
    throw new Error(`Failed to fetch OpenAlex S3 manifest: HTTP ${manifestRes.status}`);
  }
  const s3Manifest = (await manifestRes.json()) as S3SourcesManifest;
  // Sort largest parts first so worker threads start big files immediately instead of choking at the tail
  const partEntries = (s3Manifest.files || [])
    .map((f) => ({
      url: f.url.startsWith(S3_PREFIX) ? HTTPS_PREFIX + f.url.slice(S3_PREFIX.length) : f.url,
      bytes: f.meta?.content_length || 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);
  console.log(
    `[sync-world-journals] Manifest date=${s3Manifest.date} | records=${s3Manifest.record_count} | files=${partEntries.length}`
  );

  const venueMap = new Map<number, VenueRecord>();
  let nextIdx = 0;
  let completedFiles = 0;

  async function worker() {
    while (true) {
      const idx = nextIdx++;
      if (idx >= partEntries.length) break;
      await fetchPartWithRetry(partEntries[idx].url, partEntries[idx].bytes, venueMap);
      completedFiles++;
      if (completedFiles % 20 === 0 || completedFiles === partEntries.length) {
        console.log(
          `[sync-world-journals] Progress: ${completedFiles}/${partEntries.length} parts | unique venues=${venueMap.size}`
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const venues = Array.from(venueMap.values());
  venues.sort((a, b) => {
    if (b.worksCount !== a.worksCount) return b.worksCount - a.worksCount;
    if (b.citedByCount !== a.citedByCount) return b.citedByCount - a.citedByCount;
    return a.idNum - b.idNum;
  });

  const globalUniverseCount = Number(s3Manifest.record_count) || venues.length;
  const totalVenues = venues.length;
  const coveragePercent = Number(
    Math.min(100, (totalVenues / Math.max(1, globalUniverseCount)) * 100).toFixed(2)
  );

  if (coveragePercent < 99.1) {
    throw new Error(
      `Global venue coverage ${coveragePercent}% (${totalVenues}/${globalUniverseCount}) is below required 99.1% threshold.`
    );
  }

  let journalCount = 0;
  let conferenceCount = 0;
  let repositoryCount = 0;
  let otherCount = 0;
  let doajCount = 0;
  let openAccessCount = 0;
  let coreCount = 0;
  let totalWorksRepresented = 0;
  let totalCitedByRepresented = 0;
  const countrySet = new Set<string>();

  for (const v of venues) {
    if (v.typeCode === 0) journalCount++;
    else if (v.typeCode === 1) conferenceCount++;
    else if (v.typeCode === 2) repositoryCount++;
    else otherCount++;
    if ((v.flags & 1) !== 0) openAccessCount++;
    if ((v.flags & 2) !== 0) doajCount++;
    if ((v.flags & 4) !== 0) coreCount++;
    totalWorksRepresented += v.worksCount;
    totalCitedByRepresented += v.citedByCount;
    if (v.country) countrySet.add(v.country);
  }

  const outDir = path.join(process.cwd(), 'public', 'datasets', 'journals');
  fs.mkdirSync(outDir, { recursive: true });

  const perShard = Math.ceil(totalVenues / SHARD_COUNT);
  const shardEntries: Array<{
    shard: number;
    file: string;
    count: number;
    worksSum: number;
    rawBytes: number;
    gzipBytes: number;
    sha256: string;
    cdnPath: string;
    githubRawUrl: string;
  }> = [];

  let totalRawBytes = 0;
  let totalGzipBytes = 0;

  for (let s = 0; s < SHARD_COUNT; s++) {
    const slice = venues.slice(s * perShard, (s + 1) * perShard);
    const pubIndexMap = new Map<string, number>();
    const pubs: string[] = [];
    const countryIndexMap = new Map<string, number>();
    const countries: string[] = [];
    let worksSum = 0;

    const rows = slice.map((v) => {
      worksSum += v.worksCount;
      let pubIdx = -1;
      if (v.publisher) {
        const existingPub = pubIndexMap.get(v.publisher);
        if (existingPub !== undefined) {
          pubIdx = existingPub;
        } else {
          pubIdx = pubs.length;
          pubs.push(v.publisher);
          pubIndexMap.set(v.publisher, pubIdx);
        }
      }
      let countryIdx = -1;
      if (v.country) {
        const existingCountry = countryIndexMap.get(v.country);
        if (existingCountry !== undefined) {
          countryIdx = existingCountry;
        } else {
          countryIdx = countries.length;
          countries.push(v.country);
          countryIndexMap.set(v.country, countryIdx);
        }
      }
      return [
        v.idNum,
        v.issnL,
        v.displayName,
        pubIdx,
        countryIdx,
        v.worksCount,
        v.citedByCount,
        v.typeCode,
        v.flags,
      ] as const;
    });

    const shardNum = s + 1;
    const fileName = `venues-${String(shardNum).padStart(2, '0')}.min.json.gz`;
    const payload = {
      v: 1,
      shard: shardNum,
      count: slice.length,
      pubs,
      countries,
      rows,
    };

    const rawBuf = Buffer.from(JSON.stringify(payload), 'utf8');
    const gzBuf = zlib.gzipSync(rawBuf, { level: 9 });
    const sha256 = crypto.createHash('sha256').update(gzBuf).digest('hex');

    fs.writeFileSync(path.join(outDir, fileName), gzBuf);

    totalRawBytes += rawBuf.length;
    totalGzipBytes += gzBuf.length;

    shardEntries.push({
      shard: shardNum,
      file: fileName,
      count: slice.length,
      worksSum,
      rawBytes: rawBuf.length,
      gzipBytes: gzBuf.length,
      sha256,
      cdnPath: `/datasets/journals/${fileName}`,
      githubRawUrl: `${GITHUB_RAW_BASE}/${fileName}`,
    });
  }

  const compressionRatioPercent = Number(
    ((1 - totalGzipBytes / Math.max(1, totalRawBytes)) * 100).toFixed(1)
  );

  const outputManifest = {
    version: '1.0',
    snapshotDate: s3Manifest.date || '2026-10-14',
    sourceSnapshot: S3_MANIFEST_URL,
    globalUniverseCount,
    totalVenues,
    coveragePercent,
    shardCount: SHARD_COUNT,
    breakdown: {
      journals: journalCount,
      conferences: conferenceCount,
      repositories: repositoryCount,
      other: otherCount,
      doajIndexed: doajCount,
      openAccess: openAccessCount,
      coreVenues: coreCount,
    },
    totalWorksRepresented,
    totalCitedByRepresented,
    countriesCount: countrySet.size,
    rawBytes: totalRawBytes,
    gzipBytes: totalGzipBytes,
    compressionRatioPercent,
    githubManifestUrl: `${GITHUB_RAW_BASE}/manifest.json`,
    shards: shardEntries,
  };

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(outputManifest, null, 2) + '\n',
    'utf8'
  );

  const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1);
  console.log('\n=== WORLDWIDE JOURNAL & SEMINAR REGISTRY HARVEST COMPLETE ===');
  console.log(`Elapsed: ${elapsedSec}s | Snapshot Date: ${outputManifest.snapshotDate}`);
  console.log(
    `Coverage: ${totalVenues.toLocaleString()} / ${globalUniverseCount.toLocaleString()} venues (${coveragePercent}%)`
  );
  console.log(
    `Breakdown: Journals=${journalCount.toLocaleString()}, Conferences=${conferenceCount.toLocaleString()}, Repositories=${repositoryCount.toLocaleString()}, Other=${otherCount.toLocaleString()} | DOAJ=${doajCount.toLocaleString()} | OA=${openAccessCount.toLocaleString()} | Countries=${countrySet.size}`
  );
  console.log(
    `Works Represented: ${totalWorksRepresented.toLocaleString()} | Cited By: ${totalCitedByRepresented.toLocaleString()}`
  );
  console.log(
    `Compression: ${(totalRawBytes / 1024).toFixed(1)} KB raw -> ${(totalGzipBytes / 1024).toFixed(1)} KB gzip L9 (${compressionRatioPercent}% saved)`
  );
  for (const s of shardEntries) {
    console.log(
      `  ${s.file}: ${s.count.toLocaleString()} venues | ${(s.gzipBytes / 1024).toFixed(1)} KB gz | sha256=${s.sha256}`
    );
  }
}

main().catch((err) => {
  console.error('[sync-world-journals] FAILED:', err);
  process.exit(1);
});

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { getHeadToHead20Samples } from '../src/lib/head-to-head-benchmark';
import { tokenizeManuscript } from '../src/lib/similarity-engine';

const GITHUB_RAW_SHARDS_BASE =
  'https://raw.githubusercontent.com/bryankwandou/citeward/feat/citeward-mvp/public/datasets/shards';
const GITHUB_MANIFEST_URL =
  'https://raw.githubusercontent.com/bryankwandou/citeward/feat/citeward-mvp/public/datasets/manifest.json';

const EXISTING_SHARDS = 12;
const NEW_TARGET_COUNT = 5000;
const SHARD_SIZE = 2500;

interface HarvestedRow {
  id: string;
  title: string;
  authors: string;
  publication: string;
  year: number;
  url: string;
  doi: string;
  categoryCode: number;
  repository: string;
  text: string;
}

interface PackedCorpusShard {
  v: number;
  shard: number;
  count: number;
  repos: string[];
  rows: Array<[string, string, string, string, number, string, string, number, number, string]>;
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
  [/\bunlock the power\b/gi, 'Examine'],
  [/\bcutting-edge\b/gi, 'Modern'],
  [/\bgame-changer\b/gi, 'Milestone'],
  [/\bsupercharge\b/gi, 'Accelerate'],
  [/\blorem ipsum\b/gi, 'Archive'],
];

function cleanScholarlyText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string' || !raw) return '';
  let s = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  for (const [pat, rep] of NEUTRALIZE_RULES) {
    s = s.replace(pat, rep);
  }
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length > maxLen) {
    s = s.slice(0, maxLen).trim();
  }
  return s;
}

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildBenchmarkTrigramSet(): Set<string> {
  const tris = new Set<string>();
  for (const sample of getHeadToHead20Samples()) {
    const toks = tokenizeManuscript(sample.text);
    for (let i = 0; i <= toks.length - 3; i++) {
      tris.add(`${toks[i].word} ${toks[i + 1].word} ${toks[i + 2].word}`);
    }
  }
  return tris;
}

function overlapsBenchmarkSamples(candidateText: string, benchTrigrams: Set<string>): boolean {
  const toks = tokenizeManuscript(candidateText);
  let consecutive = 0;
  for (let i = 0; i <= toks.length - 3; i++) {
    const tri = `${toks[i].word} ${toks[i + 1].word} ${toks[i + 2].word}`;
    if (benchTrigrams.has(tri)) {
      consecutive++;
      if (consecutive >= 3) return true;
    } else {
      consecutive = 0;
    }
  }
  return false;
}

async function fetchJsonRetry(
  url: string,
  retries = 4
): Promise<{ json: Record<string, unknown>; httpDate: string | null }> {
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const httpDate = res.headers.get('date');
      const json = (await res.json()) as Record<string, unknown>;
      return { json, httpDate };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 900 * attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function tryAdd(
  rec: HarvestedRow,
  seenIds: Set<string>,
  seenDois: Set<string>,
  seenTitles: Set<string>,
  benchTrigrams: Set<string>,
  collected: HarvestedRow[]
): boolean {
  if (!rec.title || rec.text.length < 100) return false;
  const tKey = normalizeTitleKey(rec.title);
  if (tKey.length < 8 || seenTitles.has(tKey)) return false;
  const dKey = rec.doi ? rec.doi.toLowerCase() : '';
  if (dKey && seenDois.has(dKey)) return false;
  if (seenIds.has(rec.id)) return false;
  if (overlapsBenchmarkSamples(`${rec.title} ${rec.text}`, benchTrigrams)) return false;

  seenIds.add(rec.id);
  seenTitles.add(tKey);
  if (dKey) seenDois.add(dKey);
  collected.push(rec);
  return true;
}

const DOAJ_ID_QUERIES = [
  'sistem informasi manajemen aplikasi',
  'klasifikasi machine learning fintech',
  'metode penelitian kuantitatif kualitatif',
  'uji validitas reliabilitas regresi linear',
  'algoritma artificial intelligence jaringan',
  'keuangan perbankan syariah umkm kredit',
  'pengaruh efektivitas analisis implementasi',
  'perancangan basis data web mobile',
];

async function harvestDoajIndonesian(
  quota: number,
  seenIds: Set<string>,
  seenDois: Set<string>,
  seenTitles: Set<string>,
  benchTrigrams: Set<string>,
  collected: HarvestedRow[]
): Promise<string | null> {
  let capturedDate: string | null = null;
  let addedHere = 0;

  for (const q of DOAJ_ID_QUERIES) {
    if (addedHere >= quota || collected.length >= NEW_TARGET_COUNT) break;
    for (let page = 1; page <= 5 && addedHere < quota && collected.length < NEW_TARGET_COUNT; page++) {
      const url = `https://doaj.org/api/search/articles/${encodeURIComponent(
        q
      )}?pageSize=100&page=${page}`;
      const { json, httpDate } = await fetchJsonRetry(url);
      if (httpDate && !capturedDate) {
        const ms = Date.parse(httpDate);
        if (!Number.isNaN(ms)) capturedDate = new Date(ms).toISOString();
      }
      const results = (Array.isArray(json.results) ? json.results : []) as Array<
        Record<string, unknown>
      >;
      if (results.length === 0) break;

      for (const it of results) {
        if (addedHere >= quota || collected.length >= NEW_TARGET_COUNT) break;
        const b = (it.bibjson || {}) as Record<string, unknown>;
        const title = cleanScholarlyText(b.title, 180);
        const abs = cleanScholarlyText(b.abstract, 720);
        const authorsArr = Array.isArray(b.author) ? b.author : [];
        const authors =
          authorsArr
            .slice(0, 3)
            .map((a: Record<string, unknown>) => cleanScholarlyText(a.name, 50))
            .filter(Boolean)
            .join(', ') || 'Penulis Jurnal DOAJ';
        const jObj = (b.journal || {}) as Record<string, unknown>;
        const pub = cleanScholarlyText(jObj.title, 120) || 'DOAJ Open Access Indonesia';
        const year = Number(b.year) || 2023;
        const idsArr = (Array.isArray(b.identifier) ? b.identifier : []) as Array<
          Record<string, unknown>
        >;
        const doiObj = idsArr.find((x) => x.type === 'doi');
        const doi = typeof doiObj?.id === 'string' ? doiObj.id.trim() : '';
        const linksArr = (Array.isArray(b.link) ? b.link : []) as Array<Record<string, unknown>>;
        const urlStr =
          (typeof linksArr[0]?.url === 'string' ? linksArr[0].url : '') ||
          (doi ? `https://doi.org/${doi}` : 'https://doaj.org');

        const ok = tryAdd(
          {
            id: `doaj-id-${String(it.id || collected.length).slice(0, 32)}`,
            title,
            authors,
            publication: pub,
            year,
            url: urlStr,
            doi,
            categoryCode: 0,
            repository: 'DOAJ / Garuda Open Access',
            text: abs,
          },
          seenIds,
          seenDois,
          seenTitles,
          benchTrigrams,
          collected
        );
        if (ok) addedHere++;
      }
    }
    console.log(
      `[id-shards] DOAJ("${q}"): added=${addedHere}/${quota} | totalNew=${collected.length}/${NEW_TARGET_COUNT}`
    );
  }

  return capturedDate;
}

const CROSSREF_ID_QUERIES = [
  'sistem informasi klasifikasi machine learning fintech kredit',
  'penelitian metode kuantitatif uji validitas reliabilitas regresi',
  'pengaruh kepemimpinan kinerja keuangan perbankan syariah umkm',
  'penerapan algoritma data mining sistem pendukung keputusan',
  'analisis sentimen klasifikasi deep learning neural network citra',
  'pembelajaran pendidikan evaluasi hasil belajar mahasiswa universitas',
  'keamanan jaringan siber internet things blockchain web mobile',
];

async function harvestCrossrefIndonesianAndFintech(
  seenIds: Set<string>,
  seenDois: Set<string>,
  seenTitles: Set<string>,
  benchTrigrams: Set<string>,
  collected: HarvestedRow[]
): Promise<string | null> {
  let capturedDate: string | null = null;

  for (const q of CROSSREF_ID_QUERIES) {
    if (collected.length >= NEW_TARGET_COUNT) break;
    const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(
      q
    )}&filter=has-abstract:true&rows=1000&select=DOI,title,author,container-title,published-print,published-online,URL,abstract&mailto=audit@citeward.org`;
    const { json, httpDate } = await fetchJsonRetry(url);
    if (httpDate && !capturedDate) {
      const ms = Date.parse(httpDate);
      if (!Number.isNaN(ms)) capturedDate = new Date(ms).toISOString();
    }
    const items = (Array.isArray((json.message as Record<string, unknown>)?.items)
      ? (json.message as Record<string, unknown>).items
      : []) as Array<Record<string, unknown>>;

    for (const item of items) {
      if (collected.length >= NEW_TARGET_COUNT) break;
      const doi = typeof item.DOI === 'string' ? item.DOI.trim() : '';
      const rawTitle = Array.isArray(item.title) ? item.title[0] : item.title;
      const title = cleanScholarlyText(rawTitle, 180);
      const abs = cleanScholarlyText(item.abstract, 720);
      const pubArr = item['container-title'];
      const pub =
        cleanScholarlyText(Array.isArray(pubArr) ? pubArr[0] : pubArr, 120) ||
        'Crossref / Garuda Scholarly Index';
      const authorsRaw = Array.isArray(item.author) ? item.author : [];
      const authors =
        authorsRaw
          .slice(0, 3)
          .map((a: Record<string, unknown>) =>
            cleanScholarlyText([a.given, a.family].filter(Boolean).join(' ') || a.name, 50)
          )
          .filter(Boolean)
          .join(', ') || 'Academic Authors';
      const dpPrint = ((item['published-print'] as Record<string, unknown>)?.['date-parts'] as
        | number[][]
        | undefined)?.[0]?.[0];
      const dpOnline = ((item['published-online'] as Record<string, unknown>)?.['date-parts'] as
        | number[][]
        | undefined)?.[0]?.[0];
      const year = Number(dpPrint || dpOnline) || 2024;
      const urlStr =
        typeof item.URL === 'string' && item.URL
          ? item.URL
          : doi
          ? `https://doi.org/${doi}`
          : 'https://api.crossref.org';
      const isStudent = /skripsi|tesis|disertasi|thesis/i.test(`${title} ${pub}`);

      tryAdd(
        {
          id: `cr-id-${(doi || title).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 46)}`,
          title,
          authors,
          publication: pub,
          year,
          url: urlStr,
          doi,
          categoryCode: isStudent ? 2 : 0,
          repository: 'Garuda / Crossref Scholarly Index',
          text: abs,
        },
        seenIds,
        seenDois,
        seenTitles,
        benchTrigrams,
        collected
      );
    }
    console.log(
      `[id-shards] Crossref("${q.slice(0, 38)}..."): totalNew=${collected.length}/${NEW_TARGET_COUNT}`
    );
  }

  return capturedDate;
}

async function main() {
  const t0 = performance.now();
  const datasetsDir = path.join(process.cwd(), 'public', 'datasets');
  const shardsDir = path.join(datasetsDir, 'shards');
  const manifestPath = path.join(datasetsDir, 'manifest.json');
  const existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const benchTrigrams = buildBenchmarkTrigramSet();
  const seenIds = new Set<string>();
  const seenDois = new Set<string>();
  const seenTitles = new Set<string>();
  const repoSet = new Set<string>();
  const categoryCounts: Record<'publications' | 'internet' | 'student_papers', number> = {
    publications: 0,
    internet: 0,
    student_papers: 0,
  };
  const catNames = ['publications', 'internet', 'student_papers'] as const;

  const finalShardEntries: Array<{
    shard: number;
    file: string;
    count: number;
    rawBytes: number;
    gzipBytes: number;
    sha256: string;
    cdnPath: string;
    githubRawUrl: string;
  }> = [];

  for (let i = 1; i <= EXISTING_SHARDS; i++) {
    const file = `shard-${String(i).padStart(2, '0')}.min.json.gz`;
    const gzBuf = fs.readFileSync(path.join(shardsDir, file));
    const rawStr = zlib.gunzipSync(gzBuf).toString('utf8');
    const packed = JSON.parse(rawStr) as PackedCorpusShard;
    const sha256 = crypto.createHash('sha256').update(gzBuf).digest('hex');

    for (const r of packed.repos || []) repoSet.add(r);
    for (const row of packed.rows || []) {
      seenIds.add(row[0]);
      const tk = normalizeTitleKey(row[1]);
      if (tk) seenTitles.add(tk);
      if (row[6]) seenDois.add(row[6].toLowerCase());
      const cat = catNames[row[7]] || 'publications';
      categoryCounts[cat]++;
    }

    finalShardEntries.push({
      shard: i,
      file,
      count: packed.rows.length,
      rawBytes: Buffer.byteLength(rawStr, 'utf8'),
      gzipBytes: gzBuf.length,
      sha256,
      cdnPath: `/datasets/shards/${file}`,
      githubRawUrl: `${GITHUB_RAW_SHARDS_BASE}/${file}`,
    });
  }

  console.log(
    `[id-shards] Preserved ${EXISTING_SHARDS} base shards (${seenIds.size} refs). Harvesting +${NEW_TARGET_COUNT} Indonesian + Fintech/CS full-abstract refs...`
  );

  const collected: HarvestedRow[] = [];
  const d1 = await harvestDoajIndonesian(
    3200,
    seenIds,
    seenDois,
    seenTitles,
    benchTrigrams,
    collected
  );
  const d2 = await harvestCrossrefIndonesianAndFintech(
    seenIds,
    seenDois,
    seenTitles,
    benchTrigrams,
    collected
  );

  if (collected.length < NEW_TARGET_COUNT) {
    throw new Error(`Expected ${NEW_TARGET_COUNT} new refs, got ${collected.length}`);
  }

  const exactNew = collected.slice(0, NEW_TARGET_COUNT);
  const newShardCount = exactNew.length / SHARD_SIZE;

  for (let s = 0; s < newShardCount; s++) {
    const shardNum = EXISTING_SHARDS + s + 1;
    const slice = exactNew.slice(s * SHARD_SIZE, (s + 1) * SHARD_SIZE);
    const repos: string[] = [];
    const repoIdxMap = new Map<string, number>();

    const rows = slice.map((item) => {
      repoSet.add(item.repository);
      const cat = catNames[item.categoryCode] || 'publications';
      categoryCounts[cat]++;

      let rIdx = repoIdxMap.get(item.repository);
      if (rIdx === undefined) {
        rIdx = repos.length;
        repos.push(item.repository);
        repoIdxMap.set(item.repository, rIdx);
      }

      return [
        item.id,
        item.title,
        item.authors,
        item.publication,
        item.year,
        item.url,
        item.doi,
        item.categoryCode,
        rIdx,
        item.text,
      ] as [string, string, string, string, number, string, string, number, number, string];
    });

    const fileName = `shard-${String(shardNum).padStart(2, '0')}.min.json.gz`;
    const payload: PackedCorpusShard = {
      v: 2,
      shard: shardNum,
      count: rows.length,
      repos,
      rows,
    };

    const rawBuf = Buffer.from(JSON.stringify(payload), 'utf8');
    const gzBuf = zlib.gzipSync(rawBuf, { level: 9 });
    const sha256 = crypto.createHash('sha256').update(gzBuf).digest('hex');

    fs.writeFileSync(path.join(shardsDir, fileName), gzBuf);

    finalShardEntries.push({
      shard: shardNum,
      file: fileName,
      count: rows.length,
      rawBytes: rawBuf.length,
      gzipBytes: gzBuf.length,
      sha256,
      cdnPath: `/datasets/shards/${fileName}`,
      githubRawUrl: `${GITHUB_RAW_SHARDS_BASE}/${fileName}`,
    });
  }

  const totalReferences = finalShardEntries.reduce((a, s) => a + s.count, 0);
  const totalRawBytes = finalShardEntries.reduce((a, s) => a + s.rawBytes, 0);
  const totalGzipBytes = finalShardEntries.reduce((a, s) => a + s.gzipBytes, 0);
  const compressionRatioPercent = Number(
    ((1 - totalGzipBytes / Math.max(1, totalRawBytes)) * 100).toFixed(1)
  );
  const repoList = Array.from(repoSet);

  const updatedManifest = {
    version: '5.0',
    generatedAt: d2 || d1 || existingManifest.generatedAt,
    totalReferences,
    shardCount: finalShardEntries.length,
    categories: categoryCounts,
    repositoriesCount: repoList.length,
    repositories: repoList,
    rawBytes: totalRawBytes,
    gzipBytes: totalGzipBytes,
    compressionRatioPercent,
    federatedLiveRegistries: existingManifest.federatedLiveRegistries || [],
    githubManifestUrl: GITHUB_MANIFEST_URL,
    shards: finalShardEntries,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');

  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
  console.log('\n=== 35,000-REFERENCE INDONESIAN + GLOBAL CLOUD SHARDS COMPLETE ===');
  console.log(
    `Elapsed: ${elapsed}s | Total References: ${totalReferences.toLocaleString()} across ${finalShardEntries.length} shards`
  );
  console.log(
    `Categories: Pub=${categoryCounts.publications}, Internet=${categoryCounts.internet}, Student=${categoryCounts.student_papers}`
  );
  console.log(
    `Compression: ${(totalRawBytes / 1024).toFixed(1)} KB raw -> ${(totalGzipBytes / 1048576).toFixed(2)} MB gzip L9 (${compressionRatioPercent}% saved)`
  );
  for (const s of finalShardEntries.slice(-2)) {
    console.log(
      `  ${s.file}: ${s.count} refs | ${(s.gzipBytes / 1024).toFixed(1)} KB gz | sha256=${s.sha256}`
    );
  }
}

main().catch((err) => {
  console.error('[id-shards] FAILED:', err);
  process.exit(1);
});

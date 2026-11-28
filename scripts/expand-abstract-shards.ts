import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const GITHUB_RAW_SHARDS_BASE =
  'https://raw.githubusercontent.com/bryankwandou/citeward/feat/citeward-mvp/public/datasets/shards';
const GITHUB_MANIFEST_URL =
  'https://raw.githubusercontent.com/bryankwandou/citeward/feat/citeward-mvp/public/datasets/manifest.json';

const EXISTING_SHARDS = 4;
const NEW_TARGET_COUNT = 20000;
const SHARD_SIZE = 2500;

interface HarvestedRow {
  id: string;
  title: string;
  authors: string;
  publication: string;
  year: number;
  url: string;
  doi: string;
  categoryCode: number; // 0=publications, 1=internet, 2=student_papers
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

async function fetchJsonWithRetry(
  url: string,
  retries = 4
): Promise<{ json: Record<string, unknown>; httpDate: string | null }> {
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} on ${url}`);
      }
      const httpDate = res.headers.get('date');
      const json = (await res.json()) as Record<string, unknown>;
      return { json, httpDate };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function tryAddRecord(
  rec: HarvestedRow,
  seenIds: Set<string>,
  seenDois: Set<string>,
  seenTitles: Set<string>,
  target: HarvestedRow[]
): boolean {
  if (!rec.title || rec.text.length < 100) return false;
  const titleKey = normalizeTitleKey(rec.title);
  if (titleKey.length < 8 || seenTitles.has(titleKey)) return false;
  const doiKey = rec.doi ? rec.doi.toLowerCase() : '';
  if (doiKey && seenDois.has(doiKey)) return false;
  if (seenIds.has(rec.id)) return false;

  seenIds.add(rec.id);
  seenTitles.add(titleKey);
  if (doiKey) seenDois.add(doiKey);
  target.push(rec);
  return true;
}

async function harvestCrossrefBatch(
  filter: string,
  repository: string,
  idPrefix: string,
  quota: number,
  seenIds: Set<string>,
  seenDois: Set<string>,
  seenTitles: Set<string>,
  collected: HarvestedRow[]
): Promise<string | null> {
  let cursor = '*';
  let addedHere = 0;
  let capturedDate: string | null = null;

  for (let page = 0; page < 15 && addedHere < quota && collected.length < NEW_TARGET_COUNT; page++) {
    const url = `https://api.crossref.org/works?filter=${encodeURIComponent(
      filter
    )}&rows=1000&cursor=${encodeURIComponent(
      cursor
    )}&select=DOI,title,author,container-title,published-print,published-online,URL,abstract,type&mailto=audit@citeward.org`;

    const { json, httpDate } = await fetchJsonWithRetry(url);
    if (httpDate) {
      const parsedMs = Date.parse(httpDate);
      if (!Number.isNaN(parsedMs)) {
        capturedDate = new Date(parsedMs).toISOString();
      }
    }

    const msg = (json.message || {}) as Record<string, unknown>;
    const nextCursor = typeof msg['next-cursor'] === 'string' ? msg['next-cursor'] : '';
    const items = (Array.isArray(msg.items) ? msg.items : []) as Array<Record<string, unknown>>;
    if (items.length === 0) break;

    for (const item of items) {
      if (addedHere >= quota || collected.length >= NEW_TARGET_COUNT) break;
      const doi = typeof item.DOI === 'string' ? item.DOI.trim() : '';
      const rawTitle = Array.isArray(item.title) ? item.title[0] : item.title;
      const title = cleanScholarlyText(rawTitle, 180);
      const abs = cleanScholarlyText(item.abstract, 720);
      const pubArr = item['container-title'];
      const pub =
        cleanScholarlyText(Array.isArray(pubArr) ? pubArr[0] : pubArr, 120) || repository;

      const authorsRaw = Array.isArray(item.author) ? item.author : [];
      const authors =
        authorsRaw
          .slice(0, 3)
          .map((a: Record<string, unknown>) =>
            cleanScholarlyText(
              [a.given, a.family].filter(Boolean).join(' ') || a.name,
              50
            )
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
      const id = `${idPrefix}-${(doi || titleKeySlug(title)).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48)}`;

      const ok = tryAddRecord(
        {
          id,
          title,
          authors,
          publication: pub,
          year,
          url: urlStr,
          doi,
          categoryCode: 0,
          repository,
          text: abs,
        },
        seenIds,
        seenDois,
        seenTitles,
        collected
      );
      if (ok) addedHere++;
    }

    console.log(
      `[expand-shards] Crossref(${filter}): added=${addedHere}/${quota} | totalNew=${collected.length}/${NEW_TARGET_COUNT}`
    );
    if (!nextCursor || nextCursor === cursor) break;
    cursor = nextCursor;
  }

  return capturedDate;
}

function titleKeySlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function harvestHalBatch(
  quota: number,
  seenIds: Set<string>,
  seenDois: Set<string>,
  seenTitles: Set<string>,
  collected: HarvestedRow[]
): Promise<void> {
  let addedHere = 0;
  for (let start = 0; start < 14000 && addedHere < quota && collected.length < NEW_TARGET_COUNT; start += 1000) {
    const url = `https://api.archives-ouvertes.fr/search/?q=abstract_s:*&fq=docType_s:(COMM%20OR%20THESE%20OR%20ART)&fl=halId_s,title_s,authFullName_s,journalTitle_s,conferenceTitle_s,publicationDateY_i,uri_s,docType_s,abstract_s&rows=1000&start=${start}&wt=json`;
    const { json } = await fetchJsonWithRetry(url);
    const resp = (json.response || {}) as Record<string, unknown>;
    const docs = (Array.isArray(resp.docs) ? resp.docs : []) as Array<Record<string, unknown>>;
    if (docs.length === 0) break;

    for (const d of docs) {
      if (addedHere >= quota || collected.length >= NEW_TARGET_COUNT) break;
      const halId = typeof d.halId_s === 'string' ? d.halId_s.trim() : '';
      if (!halId) continue;
      const rawTitle = Array.isArray(d.title_s) ? d.title_s[0] : d.title_s;
      const title = cleanScholarlyText(rawTitle, 180);
      const rawAbs = Array.isArray(d.abstract_s) ? d.abstract_s[0] : d.abstract_s;
      const abs = cleanScholarlyText(rawAbs, 720);
      const authorsRaw = Array.isArray(d.authFullName_s) ? d.authFullName_s : [];
      const authors =
        authorsRaw
          .slice(0, 3)
          .map((a) => cleanScholarlyText(a, 50))
          .filter(Boolean)
          .join(', ') || 'HAL Contributors';
      const docType = typeof d.docType_s === 'string' ? d.docType_s : 'ART';
      const isThesis = docType === 'THESE';
      const isComm = docType === 'COMM';
      const repo = isThesis
        ? 'HAL Theses & Dissertations (CNRS)'
        : isComm
        ? 'HAL Proceedings & Seminars'
        : 'HAL Open Archive (CNRS)';
      const pub =
        cleanScholarlyText(d.journalTitle_s || d.conferenceTitle_s, 120) || repo;
      const year = Number(d.publicationDateY_i) || 2023;
      const urlStr = typeof d.uri_s === 'string' ? d.uri_s : `https://hal.science/${halId}`;

      const ok = tryAddRecord(
        {
          id: `hal-exp-${halId.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
          title,
          authors,
          publication: pub,
          year,
          url: urlStr,
          doi: '',
          categoryCode: isThesis ? 2 : 0,
          repository: repo,
          text: abs,
        },
        seenIds,
        seenDois,
        seenTitles,
        collected
      );
      if (ok) addedHere++;
    }

    console.log(
      `[expand-shards] HAL(COMM|THESE|ART): added=${addedHere}/${quota} | totalNew=${collected.length}/${NEW_TARGET_COUNT}`
    );
  }
}

async function harvestPlosBatch(
  quota: number,
  seenIds: Set<string>,
  seenDois: Set<string>,
  seenTitles: Set<string>,
  collected: HarvestedRow[]
): Promise<void> {
  let addedHere = 0;
  for (let start = 0; start < 12000 && addedHere < quota && collected.length < NEW_TARGET_COUNT; start += 1000) {
    const url = `https://api.plos.org/search?q=abstract:*&fl=id,title_display,author_display,journal,publication_date,abstract&rows=1000&start=${start}&wt=json`;
    const { json } = await fetchJsonWithRetry(url);
    const resp = (json.response || {}) as Record<string, unknown>;
    const docs = (Array.isArray(resp.docs) ? resp.docs : []) as Array<Record<string, unknown>>;
    if (docs.length === 0) break;

    for (const d of docs) {
      if (addedHere >= quota || collected.length >= NEW_TARGET_COUNT) break;
      const doi = typeof d.id === 'string' ? d.id.trim() : '';
      if (!doi) continue;
      const title = cleanScholarlyText(d.title_display, 180);
      const absRaw = Array.isArray(d.abstract) ? d.abstract.join(' ') : d.abstract;
      const abs = cleanScholarlyText(absRaw, 720);
      const authorsRaw = Array.isArray(d.author_display) ? d.author_display : [];
      const authors =
        authorsRaw
          .slice(0, 3)
          .map((a) => cleanScholarlyText(a, 50))
          .filter(Boolean)
          .join(', ') || 'PLOS Authors';
      const pub = cleanScholarlyText(d.journal, 120) || 'PLOS ONE';
      const year = Number(String(d.publication_date || '2024').slice(0, 4)) || 2024;

      const ok = tryAddRecord(
        {
          id: `plos-exp-${doi.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48)}`,
          title,
          authors,
          publication: pub,
          year,
          url: `https://doi.org/${doi}`,
          doi,
          categoryCode: 0,
          repository: 'PLOS Open Access Corpus',
          text: abs,
        },
        seenIds,
        seenDois,
        seenTitles,
        collected
      );
      if (ok) addedHere++;
    }

    console.log(
      `[expand-shards] PLOS: added=${addedHere}/${quota} | totalNew=${collected.length}/${NEW_TARGET_COUNT}`
    );
  }
}

async function main() {
  const t0 = performance.now();
  const datasetsDir = path.join(process.cwd(), 'public', 'datasets');
  const shardsDir = path.join(datasetsDir, 'shards');
  const existingManifestPath = path.join(datasetsDir, 'manifest.json');
  const existingManifest = JSON.parse(fs.readFileSync(existingManifestPath, 'utf8'));

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

  // Preserve existing shards 01..04 completely intact
  for (let i = 1; i <= EXISTING_SHARDS; i++) {
    const file = `shard-${String(i).padStart(2, '0')}.min.json.gz`;
    const filePath = path.join(shardsDir, file);
    const gzBuf = fs.readFileSync(filePath);
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
    `[expand-shards] Loaded ${EXISTING_SHARDS} base shards (${seenIds.size} IDs preserved). Harvesting +${NEW_TARGET_COUNT} new full-abstract records...`
  );

  const collected: HarvestedRow[] = [];

  const capturedDate = await harvestCrossrefBatch(
    'has-abstract:true,type:proceedings-article',
    'Crossref Conference & Seminar Proceedings',
    'cr-proc',
    7000,
    seenIds,
    seenDois,
    seenTitles,
    collected
  );

  await harvestHalBatch(7000, seenIds, seenDois, seenTitles, collected);
  await harvestPlosBatch(6000, seenIds, seenDois, seenTitles, collected);

  if (collected.length < NEW_TARGET_COUNT) {
    const remaining = NEW_TARGET_COUNT - collected.length;
    console.log(`[expand-shards] Topping up remaining ${remaining} records from Crossref journal articles...`);
    await harvestCrossrefBatch(
      'has-abstract:true,type:journal-article',
      'Crossref Global Journal Registry',
      'cr-jour',
      remaining,
      seenIds,
      seenDois,
      seenTitles,
      collected
    );
  }

  if (collected.length < NEW_TARGET_COUNT) {
    throw new Error(
      `Expected ${NEW_TARGET_COUNT} new unique records, harvested only ${collected.length}`
    );
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
    version: '4.0',
    generatedAt: capturedDate || existingManifest.generatedAt,
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

  fs.writeFileSync(
    existingManifestPath,
    JSON.stringify(updatedManifest, null, 2) + '\n',
    'utf8'
  );

  // Remove obsolete duplicate file if present
  const obsoletePath = path.join(datasetsDir, 'global-corpus-2500.min.json.gz');
  if (fs.existsSync(obsoletePath)) {
    fs.rmSync(obsoletePath);
  }

  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
  console.log('\n=== 30,000-REFERENCE GITHUB CLOUD SHARDS COMPLETE ===');
  console.log(
    `Elapsed: ${elapsed}s | Total References: ${totalReferences.toLocaleString()} across ${finalShardEntries.length} shards`
  );
  console.log(
    `Categories: Pub=${categoryCounts.publications}, Internet=${categoryCounts.internet}, Student=${categoryCounts.student_papers}`
  );
  console.log(
    `Compression: ${(totalRawBytes / 1024).toFixed(1)} KB raw -> ${(totalGzipBytes / 1024).toFixed(1)} KB gzip L9 (${compressionRatioPercent}% saved)`
  );
  for (const s of finalShardEntries) {
    console.log(
      `  ${s.file}: ${s.count} refs | ${(s.gzipBytes / 1024).toFixed(1)} KB gz | sha256=${s.sha256}`
    );
  }
}

main().catch((err) => {
  console.error('[expand-shards] FAILED:', err);
  process.exit(1);
});


import { CorpusSource } from './corpus';
import { extractTextFromPdfBuffer } from './document-parser';
import { findBibliographyStart } from './similarity-engine';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were',
  'been', 'being', 'have', 'has', 'had', 'into', 'over', 'such', 'than', 'then',
  'they', 'their', 'there', 'these', 'those', 'which', 'while', 'when', 'where',
  'what', 'also', 'more', 'most', 'very', 'only', 'using', 'used', 'between',
  'through', 'during', 'about', 'after', 'before', 'yang', 'dan', 'untuk',
  'dari', 'dengan', 'pada', 'dalam', 'adalah', 'sebagai', 'bahwa', 'oleh',
  'atau', 'juga', 'dapat', 'akan', 'tidak', 'telah', 'lebih', 'seperti',
  'tersebut', 'terhadap', 'melalui', 'karena', 'antara', 'sehingga', 'secara',
  'serta', 'yaitu', 'yakni', 'maupun', 'namun', 'tetapi', 'bahkan', 'masih',
  'sudah', 'harus', 'perlu', 'bisa', 'satu', 'dua', 'tiga', 'empat', 'lima',
]);

/**
 * Strict SSRF validator before fetching any external scholarly open-access URL.
 */
function isSafePublicHttpsUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
      return false;
    }
    if (host.startsWith('[') || host.includes(':')) return false;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
      const octets = host.split('.').map(Number);
      if (
        octets[0] === 10 ||
        octets[0] === 127 ||
        octets[0] === 0 ||
        (octets[0] === 169 && octets[1] === 254) ||
        (octets[0] === 192 && octets[1] === 168) ||
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      ) {
        return false;
      }
    }
    return host.includes('.');
  } catch {
    return false;
  }
}

/**
 * Extracts explicit DOIs cited in the manuscript (e.g. 10.56963/tematika.v9i1.119).
 */
export function extractCitedDois(text: string): string[] {
  const regex = /\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+[\p{L}\p{N}])/gu;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null && seen.size < 6) {
    const clean = m[1].replace(/[.,;)\]]+$/, '');
    if (clean.length >= 8) {
      seen.add(clean);
    }
  }
  return Array.from(seen);
}

/**
 * Extracts distributed, high-signal academic search queries spanning beginning, middle,
 * methodology, discussion, and conclusion of the manuscript (never just the first sentence).
 */
export function extractSearchQueries(text: string): string[] {
  const bibStart = findBibliographyStart(text);
  const fullBody = text.slice(0, bibStart).trim() || text;
  // Skip potential cover page / Table of Contents on long PDFs
  const startOffset = fullBody.length > 2600 ? Math.min(800, Math.floor(fullBody.length * 0.08)) : 0;
  const body = fullBody.slice(startOffset).trim() || fullBody;

  const sentences = body
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => {
      const wc = (s.match(/[\p{L}\p{N}]+/gu) || []).length;
      return wc >= 8 && wc <= 60;
    });

  if (sentences.length === 0) {
    const words = body.split(/\s+/).slice(0, 14).join(' ');
    return words ? [words] : [];
  }

  const picked: string[] = [];
  const sampleFractions = [0.0, 0.2, 0.45, 0.7, 0.9];
  for (const frac of sampleFractions) {
    const idx = Math.min(sentences.length - 1, Math.floor(sentences.length * frac));
    const s = sentences[idx];
    const keywords = s
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase()))
      .slice(0, 9)
      .join(' ');
    if (keywords.length >= 16) {
      picked.push(keywords);
    }
  }

  return Array.from(new Set(picked)).slice(0, 5);
}

function reconstructOpenAlexAbstract(
  inverted: Record<string, number[]> | null | undefined
): string {
  if (!inverted || typeof inverted !== 'object') return '';
  const positions: Array<[number, string]> = [];
  for (const [word, idxs] of Object.entries(inverted)) {
    if (Array.isArray(idxs)) {
      for (const pos of idxs) {
        positions.push([pos, word]);
      }
    }
  }
  positions.sort((a, b) => a[0] - b[0]);
  return positions.map((p) => p[1]).join(' ');
}

async function fetchSafeRemoteText(url: string): Promise<string> {
  if (!isSafePublicHttpsUrl(url)) return '';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CitewardAcademicIndexer/1.4 (+https://citeward.vercel.app)',
        Accept: 'application/pdf,text/html,text/plain;q=0.9',
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return '';

    const cType = (res.headers.get('content-type') || '').toLowerCase();
    const lenHeader = Number(res.headers.get('content-length') || 0);
    if (lenHeader > 900_000) return '';

    if (cType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
      const ab = await res.arrayBuffer();
      if (ab.byteLength > 900_000) return '';
      const parsed = extractTextFromPdfBuffer(Buffer.from(ab));
      return parsed.text.slice(0, 24000);
    }

    if (cType.includes('text/html') || cType.includes('text/plain')) {
      const raw = await res.text();
      return raw
        .slice(0, 120000)
        .replace(/<(?:script|style|noscript)[\s\S]*?<\/(?:script|style|noscript)>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 16000);
    }
    return '';
  } catch {
    return '';
  }
}

async function fetchDirectDoiSource(doi: string): Promise<CorpusSource | null> {
  try {
    const [crRes, oaRes] = await Promise.all([
      fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3500),
      }).catch(() => null),
      fetch(
        `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(3500),
        }
      ).catch(() => null),
    ]);

    let title = '';
    let abstract = '';
    let authors = 'DOI Indexed Author';
    let publication = 'Crossref DOI Registry';
    let year = 2023;
    let targetUrl = `https://doi.org/${doi}`;
    let oaFullText = '';

    if (crRes && crRes.ok) {
      const crJson = await crRes.json();
      const msg = crJson?.message;
      if (msg) {
        title = Array.isArray(msg.title) ? msg.title[0] : String(msg.title || '');
        abstract = String(msg.abstract || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (Array.isArray(msg.author)) {
          authors =
            msg.author
              .slice(0, 3)
              .map((a: { given?: string; family?: string }) =>
                [a.given, a.family].filter(Boolean).join(' ')
              )
              .join(', ') || authors;
        }
        publication =
          (Array.isArray(msg['container-title']) && msg['container-title'][0]) ||
          publication;
        year =
          msg?.published?.['date-parts']?.[0]?.[0] ||
          msg?.created?.['date-parts']?.[0]?.[0] ||
          year;
        targetUrl = msg.URL || targetUrl;
      }
    }

    if (oaRes && oaRes.ok) {
      const oaJson = await oaRes.json();
      if (!title && oaJson?.title) title = String(oaJson.title);
      if (!abstract && oaJson?.abstract_inverted_index) {
        abstract = reconstructOpenAlexAbstract(oaJson.abstract_inverted_index);
      }
      const oaUrl = oaJson?.open_access?.oa_url;
      if (typeof oaUrl === 'string' && isSafePublicHttpsUrl(oaUrl)) {
        oaFullText = await fetchSafeRemoteText(oaUrl);
        if (oaFullText.length > 200) targetUrl = oaUrl;
      }
    }

    const combined = [title, abstract, oaFullText].filter(Boolean).join('. ').trim();
    if (combined.length < 30) return null;

    return {
      id: `doi-${doi.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      title: title || `DOI ${doi}`,
      authors,
      publication,
      year: Number(year),
      url: targetUrl,
      doi,
      category: 'publications',
      repository: oaFullText ? 'Crossref / OpenAccess Full-Text' : 'Crossref Direct DOI API',
      text: combined.slice(0, 28000),
    };
  } catch {
    return null;
  }
}

async function fetchOpenAlex(query: string): Promise<CorpusSource[]> {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=4`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const sources: CorpusSource[] = [];

    for (const item of results) {
      const abstractText = reconstructOpenAlexAbstract(item.abstract_inverted_index);
      const title = String(item.display_name || item.title || '').trim();
      const combinedText = `${title}. ${abstractText}`.trim();
      if (combinedText.length < 50) continue;

      const authors = Array.isArray(item.authorships)
        ? item.authorships
            .slice(0, 3)
            .map((a: { author?: { display_name?: string } }) => a?.author?.display_name)
            .filter(Boolean)
            .join(', ') || 'OpenAlex Indexed Author'
        : 'OpenAlex Indexed Author';

      const doiRaw = String(item.doi || '').replace('https://doi.org/', '');
      sources.push({
        id: `openalex-${String(item.id || Math.random()).split('/').pop()}`,
        title: title || 'OpenAlex Scholarly Work',
        authors,
        publication:
          item?.primary_location?.source?.display_name || 'OpenAlex Global Scholarly Index',
        year: Number(item.publication_year) || 2024,
        url: item.doi || item.id || 'https://openalex.org',
        doi: doiRaw || undefined,
        category: 'publications',
        repository: 'OpenAlex Live API',
        text: combinedText,
      });
    }
    return sources;
  } catch {
    return [];
  }
}

async function fetchCrossref(query: string): Promise<CorpusSource[]> {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=4`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data?.message?.items) ? data.message.items : [];
    const sources: CorpusSource[] = [];

    for (const item of items) {
      const title = Array.isArray(item.title) ? item.title[0] : String(item.title || '');
      const rawAbstract = String(item.abstract || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const combinedText = `${title}. ${rawAbstract}`.trim();
      if (combinedText.length < 45) continue;

      const authors = Array.isArray(item.author)
        ? item.author
            .slice(0, 3)
            .map((a: { given?: string; family?: string }) =>
              [a.given, a.family].filter(Boolean).join(' ')
            )
            .join(', ') || 'Crossref Indexed Author'
        : 'Crossref Indexed Author';

      const year =
        item?.published?.['date-parts']?.[0]?.[0] ||
        item?.created?.['date-parts']?.[0]?.[0] ||
        2023;

      sources.push({
        id: `crossref-${String(item.DOI || Math.random()).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
        title: title || 'Crossref DOI Record',
        authors,
        publication:
          (Array.isArray(item['container-title']) && item['container-title'][0]) ||
          'Crossref DOI Registry',
        year: Number(year),
        url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : 'https://crossref.org'),
        doi: item.DOI || undefined,
        category: 'publications',
        repository: 'Crossref Live API',
        text: combinedText,
      });
    }
    return sources;
  } catch {
    return [];
  }
}

async function fetchDoaj(query: string): Promise<CorpusSource[]> {
  try {
    const url = `https://doaj.org/api/search/articles/${encodeURIComponent(query)}?pageSize=3`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3800),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const sources: CorpusSource[] = [];

    for (const item of results) {
      const bib = item?.bibjson;
      if (!bib) continue;
      const title = String(bib.title || '').trim();
      const abstract = String(bib.abstract || '').trim();
      const combined = `${title}. ${abstract}`.trim();
      if (combined.length < 50) continue;

      const authors = Array.isArray(bib.author)
        ? bib.author
            .slice(0, 3)
            .map((a: { name?: string }) => a?.name)
            .filter(Boolean)
            .join(', ') || 'DOAJ Open Access Author'
        : 'DOAJ Open Access Author';

      const fullLink = Array.isArray(bib.link)
        ? bib.link.find((l: { type?: string; url?: string }) => l?.url)?.url
        : undefined;

      sources.push({
        id: `doaj-${String(item.id || title.slice(0, 18)).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
        title: title || 'DOAJ Open Access Article',
        authors,
        publication: bib?.journal?.title || 'Directory of Open Access Journals (DOAJ)',
        year: Number(bib.year) || 2024,
        url: fullLink || 'https://doaj.org',
        category: 'publications',
        repository: 'DOAJ Live API',
        text: combined,
      });
    }
    return sources;
  } catch {
    return [];
  }
}

async function fetchWikipedia(
  query: string,
  lang: 'en' | 'id' = 'en'
): Promise<CorpusSource[]> {
  try {
    const shortQuery = query.split(/\s+/).slice(0, 7).join(' ');
    const host = lang === 'id' ? 'id.wikipedia.org' : 'en.wikipedia.org';
    const searchUrl = `https://${host}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      shortQuery
    )}&srlimit=3&format=json&origin=*`;
    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const hits = Array.isArray(data?.query?.search) ? data.query.search : [];
    if (hits.length === 0) return [];

    // Fetch full plain-text article extracts via exlimit=max (not tiny 20-word snippets!)
    const titles = hits.map((h: { title: string }) => h.title).join('|');
    const extractUrl = `https://${host}/w/api.php?action=query&prop=extracts&exlimit=max&explaintext=1&exchars=9000&redirects=1&titles=${encodeURIComponent(
      titles
    )}&format=json&origin=*`;
    const extRes = await fetch(extractUrl, {
      signal: AbortSignal.timeout(3500),
    }).catch(() => null);

    const extractMap = new Map<string, string>();
    if (extRes && extRes.ok) {
      const extData = await extRes.json();
      const pages = Object.values(extData?.query?.pages || {}) as Array<{
        title?: string;
        extract?: string;
      }>;
      for (const p of pages) {
        if (p?.title && p?.extract) {
          extractMap.set(p.title, p.extract);
        }
      }
    }

    const sources: CorpusSource[] = [];
    for (const h of hits) {
      const title = String(h.title || 'Wikipedia Article');
      const fullExtract = extractMap.get(title) || '';
      const snippet = String(h.snippet || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      const bodyText = fullExtract.length > snippet.length ? fullExtract : snippet;
      if (bodyText.length < 40) continue;

      sources.push({
        id: `wiki-${lang}-${h.pageid || title.replace(/\s+/g, '-').toLowerCase()}`,
        title,
        authors: 'Wikipedia Contributors',
        publication:
          lang === 'id'
            ? 'Wikipedia Bahasa Indonesia Encyclopedia'
            : 'English Wikipedia Open Encyclopedia',
        year: 2026,
        url: `https://${host}/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
        category: 'internet',
        repository: `Wikipedia (${lang.toUpperCase()}) Live API`,
        text: `${title}. ${bodyText}`,
      });
    }
    return sources;
  } catch {
    return [];
  }
}

/**
 * Performs genuine multi-chunk retrieval across OpenAlex, Crossref, DOAJ, Wikipedia (EN & ID),
 * explicit DOI resolution, and open-access PDFs/URLs referenced in the manuscript.
 */
export async function fetchLiveCandidateSources(text: string): Promise<CorpusSource[]> {
  const queries = extractSearchQueries(text);
  const dois = extractCitedDois(text);
  if (queries.length === 0 && dois.length === 0) return [];

  const isId =
    /\b(yang|dan|dalam|untuk|penelitian|pada|dengan|terhadap|mahasiswa|sistem|informasi)\b/i.test(
      text.slice(0, 3000)
    );

  const tasks: Array<Promise<CorpusSource[] | CorpusSource | null>> = [];

  // 1. Direct DOI lookups (+ Open-Access PDF resolution where available)
  for (const doi of dois.slice(0, 4)) {
    tasks.push(fetchDirectDoiSource(doi));
  }

  // 2. Distributed OpenAlex, Crossref, DOAJ, and Wikipedia full-extract searches across chunks
  queries.forEach((q, idx) => {
    tasks.push(fetchOpenAlex(q));
    tasks.push(fetchCrossref(q));
    if (idx < 2) {
      tasks.push(fetchDoaj(q));
      tasks.push(fetchWikipedia(q, 'en'));
      if (isId) {
        tasks.push(fetchWikipedia(q, 'id'));
      }
    }
  });

  const settled = await Promise.allSettled(tasks);
  const dedup = new Map<string, CorpusSource>();

  for (const res of settled) {
    if (res.status !== 'fulfilled' || !res.value) continue;
    const items = Array.isArray(res.value) ? res.value : [res.value];
    for (const s of items) {
      if (s && !dedup.has(s.id)) {
        dedup.set(s.id, s);
      }
    }
  }

  return Array.from(dedup.values());
}

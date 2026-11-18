import { CorpusSource } from './corpus';
import { extractTextFromPdfBuffer } from './document-parser';
import { findBibliographyStart } from './similarity-engine';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were',
  'been', 'being', 'have', 'has', 'had', 'into', 'over', 'such', 'than', 'then',
  'they', 'their', 'there', 'these', 'those', 'which', 'while', 'when', 'where',
  'what', 'also', 'more', 'most', 'very', 'only', 'using', 'used', 'between',
  'through', 'during', 'about', 'after', 'before', 'study', 'paper', 'research',
  'analysis', 'results', 'based', 'method', 'methods', 'approach', 'system',
  'yang', 'dan', 'untuk', 'dari', 'dengan', 'pada', 'dalam', 'adalah', 'sebagai',
  'bahwa', 'oleh', 'atau', 'juga', 'dapat', 'akan', 'tidak', 'telah', 'lebih',
  'seperti', 'tersebut', 'terhadap', 'melalui', 'karena', 'antara', 'sehingga',
  'secara', 'serta', 'yaitu', 'yakni', 'maupun', 'namun', 'tetapi', 'bahkan',
  'masih', 'sudah', 'harus', 'perlu', 'bisa', 'satu', 'dua', 'tiga', 'empat',
  'lima', 'penelitian', 'hasil', 'data', 'merupakan', 'dilakukan', 'digunakan',
  'menunjukkan', 'berdasarkan', 'bagian', 'bab',
]);

const MAILTO = 'research@citeward.org';
const USER_AGENT = `CitewardAcademicVerifier/1.5 (mailto:${MAILTO}; +https://citeward.vercel.app)`;

export interface LiveRetrievalResult {
  sources: CorpusSource[];
  stats: {
    totalFetched: number;
    apisSucceeded: string[];
    doisResolved: number;
    urlsResolved: number;
  };
}

/**
 * Strict SSRF validator before fetching any external scholarly or cited open-access URL.
 */
export function isSafePublicHttpsUrl(rawUrl: string): boolean {
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

async function safeFetchJson(url: string, timeoutMs = 4500): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function safeFetchText(url: string, timeoutMs = 4500): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/xml,text/xml,text/plain;q=0.9',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}

/**
 * Extracts explicit DOIs cited in the manuscript (e.g., 10.56963/tematika.v9i1.119).
 */
export function extractCitedDois(text: string): string[] {
  const regex = /\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+[\p{L}\p{N}])/gu;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null && seen.size < 8) {
    const clean = m[1].replace(/[.,;)\]]+$/, '');
    if (clean.length >= 8) {
      seen.add(clean);
    }
  }
  return Array.from(seen);
}

/**
 * Extracts public https:// URLs cited directly in the text or bibliography for live page/PDF inspection.
 */
export function extractCitedUrls(text: string): string[] {
  const regex = /\bhttps:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"')\].,;]+)?/g;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null && seen.size < 6) {
    const candidate = m[0].replace(/[.,;)\]]+$/, '');
    if (isSafePublicHttpsUrl(candidate) && !candidate.includes('doi.org/10.')) {
      seen.add(candidate);
    }
  }
  return Array.from(seen);
}

/**
 * Extracts concise high-signal keyword queries distributed across intro, middle, methods,
 * results, and conclusion of the manuscript. Concise 3-4 word queries maximize hit rates
 * across DOAJ, DataCite, Crossref, PLOS, arXiv, PubMed, Wikipedia ID/EN, and Wikibooks ID.
 */
export function extractSearchQueries(text: string): string[] {
  const bibStart = findBibliographyStart(text);
  const fullBody = text.slice(0, bibStart).trim() || text;
  const startOffset =
    fullBody.length > 2600 ? Math.min(800, Math.floor(fullBody.length * 0.08)) : 0;
  const body = fullBody.slice(startOffset).trim() || fullBody;

  const sentences = body
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => {
      const wc = (s.match(/[\p{L}\p{N}]+/gu) || []).length;
      return wc >= 7 && wc <= 65;
    });

  if (sentences.length === 0) {
    const fallback = body
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()))
      .slice(0, 4)
      .join(' ');
    return fallback ? [fallback] : [];
  }

  const picked: string[] = [];
  const sampleFractions = [0.0, 0.16, 0.34, 0.52, 0.72, 0.9];
  for (const frac of sampleFractions) {
    const idx = Math.min(sentences.length - 1, Math.floor(sentences.length * frac));
    const keywords = sentences[idx]
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w))
      .slice(0, 4)
      .join(' ');
    if (keywords.length >= 10) {
      picked.push(keywords);
    }
  }

  return Array.from(new Set(picked)).slice(0, 6);
}

/**
 * Extracts cited article/book titles directly from References / Daftar Pustaka lines.
 */
export function extractBibliographyQueries(text: string): string[] {
  let bibStart = findBibliographyStart(text);
  if (bibStart >= text.length - 30) {
    const fallbackMatch = text.match(
      /^\s*(references|bibliography|daftar\s+pustaka|daftar\s+referensi|works\s+cited)\s*:?\s*$/im
    );
    if (fallbackMatch && fallbackMatch.index !== undefined) {
      const lookahead = text.slice(fallbackMatch.index, fallbackMatch.index + 240);
      if (!/\.\.\.\.\s*\d+|hal\.\s*\d+/i.test(lookahead)) {
        bibStart = fallbackMatch.index;
      }
    }
  }
  if (bibStart >= text.length - 30) return [];
  const bibText = text.slice(bibStart);
  const lines = bibText
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 28 && !/^(references|bibliography|daftar\s+pustaka)/i.test(l));

  const out: string[] = [];
  for (const ln of lines.slice(0, 8)) {
    const quotedTitle = ln.match(/["“]([^"”]{15,110})["”]/)?.[1];
    const afterYear = ln.match(/\(\d{4}\)[.,:\s]+([^.]{15,100})/)?.[1];
    const rawCandidate = quotedTitle || afterYear || ln;
    const words = rawCandidate
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w))
      .slice(0, 5)
      .join(' ');
    if (words.length >= 12) out.push(words);
  }
  return Array.from(new Set(out)).slice(0, 4);
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
        'User-Agent': USER_AGENT,
        Accept: 'application/pdf,text/html,text/plain;q=0.9',
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return '';

    const cType = (res.headers.get('content-type') || '').toLowerCase();
    const lenHeader = Number(res.headers.get('content-length') || 0);
    if (lenHeader > 950_000) return '';

    if (cType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
      const ab = await res.arrayBuffer();
      if (ab.byteLength > 950_000) return '';
      const parsed = extractTextFromPdfBuffer(Buffer.from(ab));
      return parsed.text.slice(0, 28000);
    }

    if (cType.includes('text/html') || cType.includes('text/plain')) {
      const raw = await res.text();
      return raw
        .slice(0, 140000)
        .replace(/<(?:script|style|noscript|nav|header|footer)[\s\S]*?<\/(?:script|style|noscript|nav|header|footer)>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 20000);
    }
    return '';
  } catch {
    return '';
  }
}

async function fetchDirectUrlSource(url: string): Promise<CorpusSource | null> {
  const body = await fetchSafeRemoteText(url);
  if (body.length < 100) return null;
  let hostLabel = 'Cited Web Resource';
  try {
    hostLabel = new URL(url).hostname.replace(/^www\./, '');
  } catch {}
  return {
    id: `url-${hostLabel}-${url.length}-${body.slice(0, 12).replace(/[^a-zA-Z0-9]/g, '')}`,
    title: `Cited Resource: ${hostLabel}`,
    authors: hostLabel,
    publication: url,
    year: 2026,
    url,
    category: hostLabel.endsWith('.ac.id') || hostLabel.endsWith('.edu') ? 'student_papers' : 'internet',
    repository: `Direct Cited URL (${hostLabel})`,
    text: body,
  };
}

async function fetchDirectDoiSource(doi: string): Promise<CorpusSource | null> {
  const [crRaw, oaRaw] = await Promise.all([
    safeFetchJson(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${MAILTO}`,
      4500
    ),
    safeFetchJson(
      `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}?mailto=${MAILTO}`,
      4500
    ),
  ]);

  let title = '';
  let abstract = '';
  let authors = 'DOI Indexed Author';
  let publication = 'Crossref DOI Registry';
  let year = 2023;
  let targetUrl = `https://doi.org/${doi}`;
  let oaFullText = '';

  const crMsg = (crRaw as { message?: Record<string, unknown> } | null)?.message;
  if (crMsg) {
    title = Array.isArray(crMsg.title) ? String(crMsg.title[0] || '') : String(crMsg.title || '');
    abstract = String(crMsg.abstract || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (Array.isArray(crMsg.author)) {
      authors =
        crMsg.author
          .slice(0, 3)
          .map((a: { given?: string; family?: string }) =>
            [a.given, a.family].filter(Boolean).join(' ')
          )
          .join(', ') || authors;
    }
    const cTitle = crMsg['container-title'];
    if (Array.isArray(cTitle) && cTitle[0]) publication = String(cTitle[0]);
    const pubDate = crMsg.published as { 'date-parts'?: number[][] } | undefined;
    if (pubDate?.['date-parts']?.[0]?.[0]) year = pubDate['date-parts'][0][0];
    if (typeof crMsg.URL === 'string') targetUrl = crMsg.URL;
  }

  const oaJson = oaRaw as {
    title?: string;
    abstract_inverted_index?: Record<string, number[]>;
    open_access?: { oa_url?: string };
    best_oa_location?: { pdf_url?: string; landing_page_url?: string };
  } | null;

  if (oaJson) {
    if (!title && oaJson.title) title = String(oaJson.title);
    if (!abstract && oaJson.abstract_inverted_index) {
      abstract = reconstructOpenAlexAbstract(oaJson.abstract_inverted_index);
    }
    const pdfOrOaUrl =
      oaJson.best_oa_location?.pdf_url ||
      oaJson.open_access?.oa_url ||
      oaJson.best_oa_location?.landing_page_url;
    if (typeof pdfOrOaUrl === 'string' && isSafePublicHttpsUrl(pdfOrOaUrl)) {
      oaFullText = await fetchSafeRemoteText(pdfOrOaUrl);
      if (oaFullText.length > 200) targetUrl = pdfOrOaUrl;
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
    repository: oaFullText ? 'Crossref + OpenAlex OA Full-Text' : 'Crossref / OpenAlex DOI',
    text: combined.slice(0, 30000),
  };
}

async function fetchCrossrefBibliographic(query: string): Promise<CorpusSource[]> {
  const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(
    query
  )}&filter=has-abstract:true&rows=4&select=DOI,title,abstract,author,URL,link,published,container-title&mailto=${MAILTO}`;
  const data = (await safeFetchJson(url, 5000)) as {
    message?: { items?: Array<Record<string, unknown>> };
  } | null;

  const items = Array.isArray(data?.message?.items) ? data.message.items : [];
  const sources: CorpusSource[] = [];

  for (const item of items) {
    const title = Array.isArray(item.title) ? String(item.title[0] || '') : String(item.title || '');
    const rawAbstract = String(item.abstract || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const combinedText = `${title}. ${rawAbstract}`.trim();
    if (combinedText.length < 40) continue;

    const authors = Array.isArray(item.author)
      ? item.author
          .slice(0, 3)
          .map((a: { given?: string; family?: string }) =>
            [a.given, a.family].filter(Boolean).join(' ')
          )
          .join(', ') || 'Crossref Author'
      : 'Crossref Author';

    const pub = item.published as { 'date-parts'?: number[][] } | undefined;
    const year = pub?.['date-parts']?.[0]?.[0] || 2023;
    const doi = typeof item.DOI === 'string' ? item.DOI : undefined;
    const cTitle = item['container-title'];

    sources.push({
      id: `crossref-${String(doi || Math.random()).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      title: title || 'Crossref Publication',
      authors,
      publication:
        Array.isArray(cTitle) && cTitle[0] ? String(cTitle[0]) : 'Crossref Abstract Index',
      year: Number(year),
      url: typeof item.URL === 'string' ? item.URL : doi ? `https://doi.org/${doi}` : 'https://crossref.org',
      doi,
      category: 'publications',
      repository: 'Crossref Live API',
      text: combinedText,
    });
  }
  return sources;
}

async function fetchDataCite(query: string): Promise<CorpusSource[]> {
  const url = `https://api.datacite.org/dois?query=${encodeURIComponent(query)}&page[size]=4`;
  const data = (await safeFetchJson(url, 4000)) as {
    data?: Array<{
      id?: string;
      attributes?: {
        doi?: string;
        titles?: Array<{ title?: string }>;
        descriptions?: Array<{ description?: string }>;
        creators?: Array<{ name?: string }>;
        publisher?: string;
        publicationYear?: number;
        url?: string;
      };
    }>;
  } | null;

  const items = Array.isArray(data?.data) ? data.data : [];
  const sources: CorpusSource[] = [];

  for (const item of items) {
    const attr = item.attributes;
    if (!attr) continue;
    const title = attr.titles?.[0]?.title?.trim() || '';
    const desc = attr.descriptions?.[0]?.description?.replace(/<[^>]+>/g, ' ').trim() || '';
    const combined = `${title}. ${desc}`.trim();
    if (combined.length < 35) continue;

    const authors =
      attr.creators
        ?.slice(0, 3)
        .map((c) => c.name)
        .filter(Boolean)
        .join(', ') || 'DataCite Author';
    const doi = attr.doi || item.id;
    const itemUrl = attr.url || (doi ? `https://doi.org/${doi}` : 'https://datacite.org');
    const isRepo =
      itemUrl.includes('researchgate.net') ||
      itemUrl.includes('osf.io') ||
      itemUrl.includes('figshare.com');

    sources.push({
      id: `datacite-${String(doi || Math.random()).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      title: title || 'DataCite Indexed Record',
      authors,
      publication: attr.publisher || 'DataCite Repository Index',
      year: Number(attr.publicationYear) || 2024,
      url: itemUrl,
      doi,
      category: isRepo ? 'student_papers' : 'publications',
      repository: 'DataCite Live API',
      text: combined,
    });
  }
  return sources;
}

async function fetchDoaj(query: string): Promise<CorpusSource[]> {
  const url = `https://doaj.org/api/search/articles/${encodeURIComponent(query)}?pageSize=4`;
  const data = (await safeFetchJson(url, 3800)) as {
    results?: Array<{
      id?: string;
      bibjson?: {
        title?: string;
        abstract?: string;
        year?: string | number;
        author?: Array<{ name?: string }>;
        journal?: { title?: string };
        link?: Array<{ url?: string; type?: string }>;
      };
    }>;
  } | null;

  const results = Array.isArray(data?.results) ? data.results : [];
  const sources: CorpusSource[] = [];

  for (const item of results) {
    const bib = item?.bibjson;
    if (!bib) continue;
    const title = String(bib.title || '').trim();
    const abstract = String(bib.abstract || '').trim();
    const combined = `${title}. ${abstract}`.trim();
    if (combined.length < 40) continue;

    const authors = Array.isArray(bib.author)
      ? bib.author
          .slice(0, 3)
          .map((a) => a?.name)
          .filter(Boolean)
          .join(', ') || 'DOAJ Author'
      : 'DOAJ Author';
    const fullLink = Array.isArray(bib.link) ? bib.link.find((l) => l?.url)?.url : undefined;

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
}

async function fetchPlos(query: string): Promise<CorpusSource[]> {
  const url = `https://api.plos.org/search?q=everything:${encodeURIComponent(query)}&rows=3&wt=json`;
  const data = (await safeFetchJson(url, 3500)) as {
    response?: {
      docs?: Array<{
        id?: string;
        title_display?: string;
        abstract?: string[];
        author_display?: string[];
        journal?: string;
        publication_date?: string;
      }>;
    };
  } | null;

  const docs = Array.isArray(data?.response?.docs) ? data.response.docs : [];
  const sources: CorpusSource[] = [];

  for (const doc of docs) {
    const title = String(doc.title_display || '').trim();
    const abstract = Array.isArray(doc.abstract) ? doc.abstract.join(' ').trim() : '';
    const combined = `${title}. ${abstract}`.trim();
    if (combined.length < 50) continue;

    sources.push({
      id: `plos-${String(doc.id || Math.random()).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      title: title || 'PLOS Article',
      authors: Array.isArray(doc.author_display)
        ? doc.author_display.slice(0, 3).join(', ')
        : 'PLOS Author',
      publication: doc.journal || 'PLOS Open Science',
      year: doc.publication_date ? Number(doc.publication_date.slice(0, 4)) : 2024,
      url: doc.id ? `https://doi.org/${doc.id}` : 'https://plos.org',
      doi: doc.id,
      category: 'publications',
      repository: 'PLOS Live API',
      text: combined,
    });
  }
  return sources;
}

async function fetchHal(query: string): Promise<CorpusSource[]> {
  const url = `https://api.archives-ouvertes.fr/search/?q=${encodeURIComponent(
    query
  )}&rows=3&wt=json&fl=title_s,abstract_s,uri_s,authFullName_s,producedDateY_i`;
  const data = (await safeFetchJson(url, 3500)) as {
    response?: {
      docs?: Array<{
        title_s?: string[];
        abstract_s?: string[];
        uri_s?: string;
        authFullName_s?: string[];
        producedDateY_i?: number;
      }>;
    };
  } | null;

  const docs = Array.isArray(data?.response?.docs) ? data.response.docs : [];
  const sources: CorpusSource[] = [];

  for (const doc of docs) {
    const title = doc.title_s?.[0]?.trim() || '';
    const abstract = doc.abstract_s?.[0]?.trim() || '';
    const combined = `${title}. ${abstract}`.trim();
    if (combined.length < 40) continue;

    sources.push({
      id: `hal-${String(doc.uri_s || title.slice(0, 16)).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      title: title || 'HAL Open Archive Document',
      authors: Array.isArray(doc.authFullName_s)
        ? doc.authFullName_s.slice(0, 3).join(', ')
        : 'HAL Repository Author',
      publication: 'HAL Open Archive',
      year: Number(doc.producedDateY_i) || 2024,
      url: doc.uri_s || 'https://hal.science',
      category: 'student_papers',
      repository: 'HAL Archives Live API',
      text: combined,
    });
  }
  return sources;
}

async function fetchArxiv(query: string): Promise<CorpusSource[]> {
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
    query
  )}&max_results=3`;
  const xml = await safeFetchText(url, 4200);
  if (!xml) return [];

  const sources: CorpusSource[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRegex.exec(xml)) !== null) {
    const block = m[1];
    const idUrl = block.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || '';
    const title =
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, ' ').trim() || '';
    const summary =
      block.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, ' ').trim() || '';
    const yearStr = block.match(/<published>(\d{4})/)?.[1];
    const authors: string[] = [];
    const authRegex = /<author>\s*<name>([^<]+)<\/name>/g;
    let am: RegExpExecArray | null;
    while ((am = authRegex.exec(block)) !== null && authors.length < 3) {
      authors.push(am[1].trim());
    }

    const combined = `${title}. ${summary}`.trim();
    if (combined.length < 50) continue;

    sources.push({
      id: `arxiv-${idUrl.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '-') || Math.random()}`,
      title: title || 'arXiv Preprint',
      authors: authors.join(', ') || 'arXiv Author',
      publication: 'arXiv Preprint Archive',
      year: yearStr ? Number(yearStr) : 2024,
      url: idUrl || 'https://arxiv.org',
      category: 'publications',
      repository: 'arXiv Live API',
      text: combined,
    });
  }
  return sources;
}

async function fetchPubMed(query: string): Promise<CorpusSource[]> {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
    query
  )}&retmode=json&retmax=3`;
  const searchJson = (await safeFetchJson(searchUrl, 3800)) as {
    esearchresult?: { idlist?: string[] };
  } | null;
  const ids = searchJson?.esearchresult?.idlist;
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const xml = await safeFetchText(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(
      ','
    )}&retmode=xml`,
    4200
  );
  if (!xml) return [];

  const sources: CorpusSource[] = [];
  const artRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  let m: RegExpExecArray | null;
  while ((m = artRegex.exec(xml)) !== null) {
    const block = m[1];
    const pmid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] || '';
    const title =
      block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, '').trim() ||
      '';
    const abstractParts: string[] = [];
    const absRegex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
    let abm: RegExpExecArray | null;
    while ((abm = absRegex.exec(block)) !== null) {
      abstractParts.push(abm[1].replace(/<[^>]+>/g, '').trim());
    }
    const abstract = abstractParts.join(' ');
    const combined = `${title}. ${abstract}`.trim();
    if (combined.length < 40) continue;

    sources.push({
      id: `pubmed-${pmid || Math.random()}`,
      title: title || `PubMed PMID ${pmid}`,
      authors: 'PubMed Indexed Author',
      publication: 'NCBI PubMed Central',
      year: 2024,
      url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : 'https://pubmed.ncbi.nlm.nih.gov/',
      category: 'publications',
      repository: 'PubMed E-utilities Live API',
      text: combined,
    });
  }
  return sources;
}

async function fetchMediaWikiSource(
  query: string,
  host: 'en.wikipedia.org' | 'id.wikipedia.org' | 'id.wikibooks.org',
  label: string
): Promise<CorpusSource[]> {
  const shortQuery = query.split(/\s+/).slice(0, 4).join(' ');
  const searchUrl = `https://${host}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    shortQuery
  )}&srlimit=3&format=json&origin=*`;
  const data = (await safeFetchJson(searchUrl, 3200)) as {
    query?: { search?: Array<{ title: string; pageid?: number; snippet?: string }> };
  } | null;

  const hits = Array.isArray(data?.query?.search) ? data.query.search : [];
  if (hits.length === 0) return [];

  const titles = hits.map((h) => h.title).join('|');
  const extractUrl = `https://${host}/w/api.php?action=query&prop=extracts&exlimit=max&explaintext=1&exchars=12000&redirects=1&titles=${encodeURIComponent(
    titles
  )}&format=json&origin=*`;
  const extData = (await safeFetchJson(extractUrl, 3500)) as {
    query?: { pages?: Record<string, { title?: string; extract?: string }> };
  } | null;

  const extractMap = new Map<string, string>();
  if (extData?.query?.pages) {
    for (const p of Object.values(extData.query.pages)) {
      if (p?.title && p?.extract) {
        extractMap.set(p.title, p.extract);
      }
    }
  }

  const sources: CorpusSource[] = [];
  for (const h of hits) {
    const title = String(h.title || label);
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
      id: `mw-${host.split('.')[0]}-${host.split('.')[1]}-${h.pageid || title.replace(/\s+/g, '-').toLowerCase()}`,
      title,
      authors: `${label} Contributors`,
      publication: label,
      year: 2026,
      url: `https://${host}/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
      category: 'internet',
      repository: `${label} Live API`,
      text: `${title}. ${bodyText}`,
    });
  }
  return sources;
}

/**
 * Multi-API parallel open-web & scholarly source retrieval with transparent telemetry:
 * Queries Crossref Direct DOI, OpenAlex Single DOI (+ OA PDFs), Direct Cited HTTPS URLs,
 * Crossref Bibliographic Search, DataCite, DOAJ, PLOS, HAL Open Archive, arXiv, PubMed,
 * Wikipedia (EN + ID), and Wikibooks ID.
 */
export async function fetchLiveCandidateSourcesDetailed(
  text: string
): Promise<LiveRetrievalResult> {
  const queries = extractSearchQueries(text);
  const bibQueries = extractBibliographyQueries(text);
  const dois = extractCitedDois(text);
  const citedUrls = extractCitedUrls(text);

  if (
    queries.length === 0 &&
    bibQueries.length === 0 &&
    dois.length === 0 &&
    citedUrls.length === 0
  ) {
    return {
      sources: [],
      stats: { totalFetched: 0, apisSucceeded: [], doisResolved: 0, urlsResolved: 0 },
    };
  }

  const isId =
    /\b(yang|dan|dalam|untuk|penelitian|pada|dengan|terhadap|mahasiswa|sistem|informasi|skripsi|pustaka)\b/i.test(
      text.slice(0, 4000)
    );

  const taggedTasks: Array<{ tag: string; promise: Promise<CorpusSource[] | CorpusSource | null> }> =
    [];

  // 1. Direct DOI lookups + Open-Access PDF resolution
  for (const doi of dois.slice(0, 6)) {
    taggedTasks.push({ tag: 'DOI Registry', promise: fetchDirectDoiSource(doi) });
  }

  // 2. Direct cited HTTPS URLs inside document
  for (const u of citedUrls.slice(0, 4)) {
    taggedTasks.push({ tag: 'Cited Web URLs', promise: fetchDirectUrlSource(u) });
  }

  // 3. Bibliography title searches on Crossref + DataCite + DOAJ
  for (const bq of bibQueries.slice(0, 3)) {
    taggedTasks.push({ tag: 'Crossref Bibliographic', promise: fetchCrossrefBibliographic(bq) });
    taggedTasks.push({ tag: 'DataCite', promise: fetchDataCite(bq) });
  }

  // 4. Distributed multi-section keyword queries across all fast open APIs
  queries.forEach((q, idx) => {
    taggedTasks.push({ tag: 'DOAJ', promise: fetchDoaj(q) });
    taggedTasks.push({ tag: 'DataCite', promise: fetchDataCite(q) });
    if (idx < 3) {
      taggedTasks.push({ tag: 'Crossref Bibliographic', promise: fetchCrossrefBibliographic(q) });
      taggedTasks.push({ tag: 'Wikipedia EN', promise: fetchMediaWikiSource(q, 'en.wikipedia.org', 'Wikipedia EN') });
      if (isId) {
        taggedTasks.push({ tag: 'Wikipedia ID', promise: fetchMediaWikiSource(q, 'id.wikipedia.org', 'Wikipedia ID') });
      }
    }
    if (idx < 2) {
      taggedTasks.push({ tag: 'PLOS', promise: fetchPlos(q) });
      taggedTasks.push({ tag: 'HAL Archive', promise: fetchHal(q) });
      taggedTasks.push({ tag: 'arXiv', promise: fetchArxiv(q) });
      taggedTasks.push({ tag: 'PubMed', promise: fetchPubMed(q) });
      if (isId) {
        taggedTasks.push({ tag: 'Wikibooks ID', promise: fetchMediaWikiSource(q, 'id.wikibooks.org', 'Wikibooks ID') });
      }
    }
  });

  const settled = await Promise.allSettled(taggedTasks.map((t) => t.promise));
  const dedup = new Map<string, CorpusSource>();
  const apiHits = new Set<string>();
  let doisResolved = 0;
  let urlsResolved = 0;

  settled.forEach((res, idx) => {
    if (res.status !== 'fulfilled' || !res.value) return;
    const tag = taggedTasks[idx].tag;
    const items = Array.isArray(res.value) ? res.value : [res.value];
    if (items.length > 0) {
      apiHits.add(tag);
      if (tag === 'DOI Registry') doisResolved += items.length;
      if (tag === 'Cited Web URLs') urlsResolved += items.length;
      for (const s of items) {
        if (s && !dedup.has(s.id)) {
          dedup.set(s.id, s);
        }
      }
    }
  });

  const sources = Array.from(dedup.values());
  return {
    sources,
    stats: {
      totalFetched: sources.length,
      apisSucceeded: Array.from(apiHits),
      doisResolved,
      urlsResolved,
    },
  };
}

export async function fetchLiveCandidateSources(text: string): Promise<CorpusSource[]> {
  const { sources } = await fetchLiveCandidateSourcesDetailed(text);
  return sources;
}

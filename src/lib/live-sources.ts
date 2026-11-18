import { CorpusSource } from './corpus';
import { findBibliographyStart } from './similarity-engine';

/**
 * Extracts 2-3 high-signal search queries from the manuscript body
 * so we can query OpenAlex, Crossref, Wikipedia, and arXiv in parallel.
 */
export function extractSearchQueries(text: string): string[] {
  const bibStart = findBibliographyStart(text);
  const body = text.slice(0, bibStart).trim() || text;
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 260);

  if (sentences.length === 0) {
    const words = body.split(/\s+/).slice(0, 14).join(' ');
    return words ? [words] : [];
  }

  const picked: string[] = [];
  picked.push(sentences[0].slice(0, 140));
  if (sentences.length > 2) {
    picked.push(sentences[Math.floor(sentences.length / 2)].slice(0, 140));
  }
  return Array.from(new Set(picked));
}

function reconstructOpenAlexAbstract(inverted: Record<string, number[]> | null | undefined): string {
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

async function fetchOpenAlex(query: string): Promise<CorpusSource[]> {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=4`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
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
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=3`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
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

async function fetchWikipedia(query: string): Promise<CorpusSource[]> {
  try {
    const shortQuery = query.split(/\s+/).slice(0, 8).join(' ');
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      shortQuery
    )}&srlimit=3&format=json&origin=*`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const hits = Array.isArray(data?.query?.search) ? data.query.search : [];
    const sources: CorpusSource[] = [];

    for (const h of hits) {
      const snippet = String(h.snippet || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      if (snippet.length < 40) continue;

      const title = String(h.title || 'Wikipedia Article');
      sources.push({
        id: `wiki-${h.pageid || title.replace(/\s+/g, '-').toLowerCase()}`,
        title,
        authors: 'Wikipedia Contributors',
        publication: 'English Wikipedia Open Encyclopedia',
        year: 2026,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
        category: 'internet',
        repository: 'Wikipedia Live API',
        text: `${title}. ${snippet}`,
      });
    }
    return sources;
  } catch {
    return [];
  }
}

/**
 * Queries OpenAlex, Crossref, and Wikipedia in parallel for the manuscript's keyphrases.
 */
export async function fetchLiveCandidateSources(text: string): Promise<CorpusSource[]> {
  const queries = extractSearchQueries(text);
  if (queries.length === 0) return [];

  const q0 = queries[0];
  const [oa, cr, wk] = await Promise.all([
    fetchOpenAlex(q0),
    fetchCrossref(q0),
    fetchWikipedia(q0),
  ]);

  const dedup = new Map<string, CorpusSource>();
  for (const s of [...oa, ...cr, ...wk]) {
    if (!dedup.has(s.id)) {
      dedup.set(s.id, s);
    }
  }
  return Array.from(dedup.values());
}


import { CorpusSource } from './corpus';

function extractBrowserCitedDois(text: string): string[] {
  const matches = text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/g) || [];
  return Array.from(
    new Set(matches.map((m) => m.replace(/[.,;)\]]+$/, '')))
  ).slice(0, 3);
}

function extractBrowserPrimaryQuery(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const words = clean.match(/[\p{L}\p{N}]{4,}/gu) || [];
  return words.slice(0, 12).join(' ');
}

export interface BrowserParsedDocument {
  fileName: string;
  fileType: 'pdf' | 'docx' | 'odt' | 'rtf' | 'txt' | 'md' | 'tex' | 'html' | 'unknown';
  byteSize: number;
  extractedTitle: string;
  text: string;
  wordCount: number;
  estimatedPages: number;
  warnings: string[];
  parsedLocally: boolean;
}

async function inflateBytesBrowser(
  bytes: Uint8Array,
  format: 'deflate' | 'deflate-raw'
): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const ds = new DecompressionStream(format);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const stream = new Blob([copy]).stream().pipeThrough(ds);
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function bytesToLatin1(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const step = 32768;
  for (let i = 0; i < bytes.length; i += step) {
    const slice = bytes.subarray(i, Math.min(bytes.length, i + step));
    let s = '';
    for (let j = 0; j < slice.length; j++) s += String.fromCharCode(slice[j]);
    chunks.push(s);
  }
  return chunks.join('');
}

async function extractZipEntriesBrowser(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const files = new Map<string, Uint8Array>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let eocdOffset = -1;
  const minOffset = Math.max(0, bytes.length - 65558);
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return files;

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let cdOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder('utf-8');

  for (let n = 0; n < totalEntries && cdOffset + 46 <= bytes.length; n++) {
    if (view.getUint32(cdOffset, true) !== 0x02014b50) break;
    const compression = view.getUint16(cdOffset + 10, true);
    const compSize = view.getUint32(cdOffset + 20, true);
    const nameLen = view.getUint16(cdOffset + 28, true);
    const extraLen = view.getUint16(cdOffset + 30, true);
    const commentLen = view.getUint16(cdOffset + 32, true);
    const localHeaderOffset = view.getUint32(cdOffset + 42, true);

    const fileName = decoder.decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));
    cdOffset += 46 + nameLen + extraLen + commentLen;

    if (!/^(word\/document\.xml|content\.xml)$/i.test(fileName)) continue;
    if (localHeaderOffset + 30 > bytes.length) continue;

    const lNameLen = view.getUint16(localHeaderOffset + 26, true);
    const lExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
    const dataEnd = dataStart + compSize;
    if (dataEnd > bytes.length) continue;

    const rawSlice = bytes.subarray(dataStart, dataEnd);
    if (compression === 0) {
      files.set(fileName, rawSlice);
    } else if (compression === 8) {
      const inflated = await inflateBytesBrowser(rawSlice, 'deflate-raw');
      if (inflated) files.set(fileName, inflated);
    }
  }
  return files;
}

function decodePdfLiteralBrowser(raw: string): string {
  const bytes: number[] = [];
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '\\' && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (/[0-7]/.test(next)) {
        const oct = raw.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] || next;
        bytes.push(parseInt(oct, 8) & 0xff);
        i += 1 + oct.length;
        continue;
      }
      if (next === 'n') bytes.push(10);
      else if (next === 'r') bytes.push(13);
      else if (next === 't') bytes.push(9);
      else if (next === '(') bytes.push(40);
      else if (next === ')') bytes.push(41);
      else if (next === '\\') bytes.push(92);
      else bytes.push(next.charCodeAt(0) & 0xff);
      i += 2;
    } else {
      bytes.push(ch.charCodeAt(0) & 0xff);
      i++;
    }
  }
  return bytes
    .map((b) =>
      b === 0x91 || b === 0x92
        ? "'"
        : b === 0x93 || b === 0x94
          ? '"'
          : b === 0x96 || b === 0x97
            ? '-'
            : String.fromCharCode(b)
    )
    .join('');
}

function decodeUtf16BeHex(dstHex: string): string {
  const clean = dstHex.replace(/\s+/g, '');
  if (clean.length <= 2) {
    const cp = parseInt(clean, 16);
    return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : '';
  }
  let s = '';
  for (let i = 0; i < clean.length; i += 4) {
    const cp = parseInt(clean.slice(i, i + 4), 16);
    if (Number.isFinite(cp) && cp > 0) s += String.fromCodePoint(cp);
  }
  return s;
}

async function extractPdfBrowser(bytes: Uint8Array): Promise<{
  text: string;
  pageCount: number;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const rawLatin1 = bytesToLatin1(bytes);
  const isEncrypted = /\/Encrypt\s+\d+\s+\d+\s+R|\/Encrypt\s*<</.test(rawLatin1);
  const pageMatches = rawLatin1.match(/\/Type\s*\/Page\b(?!s)/g);
  const pageCount = Math.max(1, pageMatches ? pageMatches.length : 1);

  const cmap1 = new Map<number, string>();
  const cmap2 = new Map<number, string>();
  const decodedStreams: string[] = [];
  let imageStreams = 0;

  let pos = 0;
  while (pos < rawLatin1.length) {
    const sIdx = rawLatin1.indexOf('stream', pos);
    if (sIdx === -1) break;
    if (sIdx >= 3 && rawLatin1.slice(sIdx - 3, sIdx) === 'end') {
      pos = sIdx + 6;
      continue;
    }
    let dataStart = sIdx + 6;
    if (rawLatin1[dataStart] === '\r' && rawLatin1[dataStart + 1] === '\n') dataStart += 2;
    else if (rawLatin1[dataStart] === '\n' || rawLatin1[dataStart] === '\r') dataStart += 1;
    else {
      pos = sIdx + 6;
      continue;
    }
    const eIdx = rawLatin1.indexOf('endstream', dataStart);
    if (eIdx === -1) break;
    let dataEnd = eIdx;
    if (rawLatin1[dataEnd - 2] === '\r' && rawLatin1[dataEnd - 1] === '\n') dataEnd -= 2;
    else if (rawLatin1[dataEnd - 1] === '\n' || rawLatin1[dataEnd - 1] === '\r') dataEnd -= 1;

    const hdr = rawLatin1.slice(Math.max(0, sIdx - 1024), sIdx);
    const isImage = /\/Subtype\s*\/Image\b/.test(hdr);
    if (isImage) imageStreams++;

    if (!isImage && dataEnd > dataStart) {
      const slice = bytes.subarray(dataStart, dataEnd);
      const hasZlib =
        slice.length >= 2 &&
        slice[0] === 0x78 &&
        (slice[1] === 0x9c || slice[1] === 0x01 || slice[1] === 0xda || slice[1] === 0x5e);
      const isFlate = /\/FlateDecode\b/.test(hdr) || hasZlib;

      let streamStr = '';
      if (isFlate) {
        const inflated =
          (await inflateBytesBrowser(slice, 'deflate')) ||
          (await inflateBytesBrowser(slice, 'deflate-raw'));
        if (inflated) streamStr = bytesToLatin1(inflated);
      } else {
        streamStr = bytesToLatin1(slice);
      }

      if (streamStr) {
        if (streamStr.includes('beginbfchar') || streamStr.includes('beginbfrange')) {
          const bfchar = /beginbfchar([\s\S]*?)endbfchar/g;
          let m: RegExpExecArray | null;
          while ((m = bfchar.exec(streamStr)) !== null) {
            const pr = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
            let p: RegExpExecArray | null;
            while ((p = pr.exec(m[1])) !== null) {
              const code = parseInt(p[1], 16);
              const val = decodeUtf16BeHex(p[2]);
              if (val) {
                if (p[1].length >= 4) {
                  if (!cmap2.has(code)) cmap2.set(code, val);
                } else if (!cmap1.has(code)) {
                  cmap1.set(code, val);
                }
              }
            }
          }
          const bfrange = /beginbfrange([\s\S]*?)endbfrange/g;
          while ((m = bfrange.exec(streamStr)) !== null) {
            const dr = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
            let r: RegExpExecArray | null;
            while ((r = dr.exec(m[1])) !== null) {
              const sc = parseInt(r[1], 16);
              const ec = parseInt(r[2], 16);
              let cp = parseInt(r[3], 16);
              const tgt = r[1].length >= 4 ? cmap2 : cmap1;
              if (ec >= sc && ec - sc <= 2048) {
                for (let c = sc; c <= ec; c++) {
                  if (!tgt.has(c) && cp > 0 && cp <= 0x10ffff) tgt.set(c, String.fromCodePoint(cp));
                  cp++;
                }
              }
            }
            const ar = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([^\]]+)\]/g;
            let a: RegExpExecArray | null;
            while ((a = ar.exec(m[1])) !== null) {
              const sc = parseInt(a[1], 16);
              const ec = parseInt(a[2], 16);
              const tgt = a[1].length >= 4 ? cmap2 : cmap1;
              const hexList = a[3].match(/<([0-9a-fA-F]+)>/g) || [];
              for (let idx = 0; idx < hexList.length && sc + idx <= ec; idx++) {
                const val = decodeUtf16BeHex(hexList[idx].slice(1, -1));
                if (val && !tgt.has(sc + idx)) tgt.set(sc + idx, val);
              }
            }
          }
        } else if (
          streamStr.includes('BT') ||
          streamStr.includes('Tj') ||
          streamStr.includes('TJ')
        ) {
          decodedStreams.push(streamStr);
        }
      }
    }
    pos = eIdx + 9;
  }

  const decodeHex = (hex: string): string => {
    const clean = hex.replace(/\s+/g, '');
    if (!clean) return '';
    if (clean.length % 4 === 0 && clean.toUpperCase().startsWith('FEFF')) {
      let s = '';
      for (let i = 4; i < clean.length; i += 4) {
        const cp = parseInt(clean.slice(i, i + 4), 16);
        if (cp > 0) s += String.fromCharCode(cp);
      }
      return s;
    }
    const use2 = clean.length % 4 === 0 && cmap2.size > 0;
    const step = use2 ? 4 : 2;
    const active = use2 ? cmap2 : cmap1;
    let out = '';
    for (let i = 0; i < clean.length; i += step) {
      const code = parseInt(clean.slice(i, i + step), 16);
      if (active.has(code)) out += active.get(code)!;
      else if (!use2 && cmap2.has(code)) out += cmap2.get(code)!;
      else if (code >= 32 && code <= 126) out += String.fromCharCode(code);
    }
    return out;
  };

  const lines: string[] = [];
  const tokenRegex =
    /(\[(?:[^\[\]]|\((?:\\.|[^\\()])*\))*\]\s*TJ|\((?:\\.|[^\\()])*\)\s*(?:Tj|'|")|<[0-9a-fA-F\s]+>\s*(?:Tj|'|")|-?\d+(?:\.\d+)?\s+(-?\d+(?:\.\d+)?)\s+T[dD]|(?:-?\d+(?:\.\d+)?\s+){5}(-?\d+(?:\.\d+)?)\s+Tm|\bT\*\b|\bET\b)/g;

  for (const content of decodedStreams) {
    let cur = '';
    let lastY: number | null = null;
    tokenRegex.lastIndex = 0;
    let tok: RegExpExecArray | null;
    while ((tok = tokenRegex.exec(content)) !== null) {
      const full = tok[1];
      if (full === 'T*' || full === 'ET') {
        if (cur.trim()) lines.push(cur.trim());
        cur = '';
        continue;
      }
      if (tok[3] !== undefined && full.endsWith('Tm')) {
        const y = parseFloat(tok[3]);
        if (lastY !== null && Math.abs(y - lastY) > 2.0) {
          if (cur.trim()) lines.push(cur.trim());
          cur = '';
          if (Math.abs(y - lastY) > 18) lines.push('');
        } else if (cur && !cur.endsWith(' ')) {
          cur += ' ';
        }
        lastY = y;
        continue;
      }
      if (tok[2] !== undefined && /T[dD]$/.test(full)) {
        const dy = parseFloat(tok[2]);
        if (Math.abs(dy) > 2.0) {
          if (cur.trim()) lines.push(cur.trim());
          cur = '';
          if (Math.abs(dy) > 18) lines.push('');
        } else if (cur && !cur.endsWith(' ')) {
          cur += ' ';
        }
        continue;
      }
      if (full.endsWith('TJ')) {
        const ir = /\(((?:\\.|[^\\()])*)\)|<([0-9a-fA-F\s]+)>|(-?\d+(?:\.\d+)?)/g;
        let part: RegExpExecArray | null;
        while ((part = ir.exec(full)) !== null) {
          if (part[1] !== undefined) cur += decodePdfLiteralBrowser(part[1]);
          else if (part[2] !== undefined) cur += decodeHex(part[2]);
          else if (part[3] !== undefined && parseFloat(part[3]) <= -65 && !cur.endsWith(' ')) cur += ' ';
        }
      } else if (full.startsWith('<')) {
        const hm = full.match(/^<([0-9a-fA-F\s]+)>/);
        if (hm) cur += decodeHex(hm[1]);
      } else {
        const lm = full.match(/^\(((?:\\.|[^\\()])*)\)/);
        if (lm) cur += decodePdfLiteralBrowser(lm[1]);
      }
    }
    if (cur.trim()) lines.push(cur.trim());
  }

  const paragraphs: string[] = [];
  let buf = '';
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line) {
      if (buf) {
        paragraphs.push(buf);
        buf = '';
      }
      continue;
    }
    if (!buf) buf = line;
    else if (buf.endsWith('-')) buf = buf.slice(0, -1) + line;
    else if (/[.!?"]$/.test(buf) && (line.length < 75 || /^[A-Z0-9"“(\[]/.test(line))) {
      paragraphs.push(buf);
      buf = line;
    } else buf += ' ' + line;
  }
  if (buf) paragraphs.push(buf);

  const text = paragraphs.join('\n\n').trim();
  if (!text) {
    warnings.push(
      isEncrypted
        ? 'This PDF is encrypted or password-protected. Remove PDF security before uploading.'
        : imageStreams > 0
          ? `This PDF contains ${imageStreams} raster image stream(s) without an embedded text layer.`
          : 'No extractable text layer found in PDF.'
    );
  }
  return { text, pageCount, warnings };
}

/**
 * Parses .TXT, .MD, .HTML, .RTF, .DOCX, .ODT, and .PDF directly inside the browser
 * with 0.000 ms Vercel Serverless CPU usage.
 */
export async function parseDocumentInBrowser(file: File): Promise<BrowserParsedDocument> {
  const fileName = file.name || 'manuscript.txt';
  const lower = fileName.toLowerCase();
  const baseTitle = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdfMagic =
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46;
  const isZipMagic =
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  let fileType: BrowserParsedDocument['fileType'] = 'txt';
  let text = '';
  let estimatedPages = 1;
  let warnings: string[] = [];

  if (lower.endsWith('.pdf') || isPdfMagic) {
    fileType = 'pdf';
    const res = await extractPdfBrowser(bytes);
    text = res.text;
    estimatedPages = res.pageCount;
    warnings = res.warnings;
  } else if (lower.endsWith('.docx') || (isZipMagic && !lower.endsWith('.odt'))) {
    fileType = 'docx';
    const entries = await extractZipEntriesBrowser(bytes);
    const docXml = entries.get('word/document.xml');
    if (docXml) {
      const xml = new TextDecoder('utf-8').decode(docXml);
      text = decodeXmlEntities(
        xml
          .replace(/<w:tab[^>]*\/>/g, ' ')
          .replace(/<w:br[^>]*\/>/g, '\n')
          .replace(/<\/w:p>/g, '\n\n')
          .replace(/<[^>]+>/g, '')
      )
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
  } else if (lower.endsWith('.odt')) {
    fileType = 'odt';
    const entries = await extractZipEntriesBrowser(bytes);
    const contentXml = entries.get('content.xml');
    if (contentXml) {
      const xml = new TextDecoder('utf-8').decode(contentXml);
      text = decodeXmlEntities(
        xml.replace(/<\/text:(?:p|h)>/g, '\n\n').replace(/<[^>]+>/g, '')
      )
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
  } else if (lower.endsWith('.rtf')) {
    fileType = 'rtf';
    const raw = new TextDecoder('utf-8').decode(bytes);
    text = raw
      .replace(/\\par\b|\\line\b/g, '\n\n')
      .replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|pict)[\s\S]*?\}/g, '')
      .replace(/\\[a-zA-Z]+-?\d*\s?/g, '')
      .replace(/[{}]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    fileType = 'html';
    const raw = new TextDecoder('utf-8').decode(bytes);
    text = decodeXmlEntities(
      raw
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<\/(?:p|div|h[1-6]|li|tr)>/gi, '\n\n')
        .replace(/<[^>]+>/g, ' ')
    )
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } else {
    fileType = lower.endsWith('.md') ? 'md' : lower.endsWith('.tex') ? 'tex' : 'txt';
    text = new TextDecoder('utf-8').decode(bytes).replace(/\r\n/g, '\n').trim();
  }

  const wordCount = (text.match(/[\p{L}\p{N}]+/gu) || []).length;
  if (fileType !== 'pdf') {
    estimatedPages = Math.max(1, Math.ceil(wordCount / 300));
  }

  return {
    fileName,
    fileType,
    byteSize: file.size,
    extractedTitle: baseTitle || 'Uploaded Manuscript',
    text,
    wordCount,
    estimatedPages,
    warnings,
    parsedLocally: true,
  };
}

function cleanSnippet(raw: string): string {
  return String(raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Queries CORS-enabled global scholarly APIs directly from the user's browser
 * (0.000 ms Vercel Serverless CPU usage!).
 */
export async function fetchLiveSourcesDirectlyFromBrowser(text: string): Promise<{
  sources: CorpusSource[];
  apisSucceeded: string[];
  doisResolved: number;
}> {
  const dois = extractBrowserCitedDois(text);
  const qPrimary = extractBrowserPrimaryQuery(text);

  const sources: CorpusSource[] = [];
  const apisSucceeded = new Set<string>();
  let doisResolved = 0;

  const tasks: Promise<void>[] = [];

  for (const doi of dois) {
    tasks.push(
      (async () => {
        try {
          const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
            signal: AbortSignal.timeout(5000),
          });
          if (!r.ok) return;
          const j = await r.json();
          const it = j?.message;
          if (!it?.title?.[0]) return;
          apisSucceeded.add('Crossref DOI');
          doisResolved++;
          sources.push({
            id: `live-doi-${doi.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
            title: cleanSnippet(it.title[0]),
            authors:
              (it.author || [])
                .slice(0, 3)
                .map((a: { given?: string; family?: string }) =>
                  [a.given, a.family].filter(Boolean).join(' ')
                )
                .join(', ') || 'Crossref Author',
            publication: cleanSnippet(it['container-title']?.[0] || 'Crossref Journal'),
            year: it.published?.['date-parts']?.[0]?.[0] || 2024,
            url: it.URL || `https://doi.org/${doi}`,
            doi,
            category: 'publications',
            repository: 'Crossref Live Browser Fetch',
            text: cleanSnippet(it.abstract || it.title[0]),
          });
        } catch {}
      })()
    );
  }

  if (qPrimary.length >= 12) {
    tasks.push(
      (async () => {
        try {
          const r = await fetch(
            `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(qPrimary)}&filter=has-abstract:true&rows=5&select=DOI,title,author,container-title,published,abstract,URL`,
            { signal: AbortSignal.timeout(5500) }
          );
          if (!r.ok) return;
          const j = await r.json();
          const items = j?.message?.items || [];
          if (items.length > 0) apisSucceeded.add('Crossref');
          for (const it of items) {
            const abs = cleanSnippet(it.abstract);
            if (abs.length < 40) continue;
            sources.push({
              id: `live-cr-${String(it.DOI).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 42)}`,
              title: cleanSnippet(it.title?.[0] || 'Crossref Publication'),
              authors:
                (it.author || [])
                  .slice(0, 3)
                  .map((a: { given?: string; family?: string }) =>
                    [a.given, a.family].filter(Boolean).join(' ')
                  )
                  .join(', ') || 'Crossref Authors',
              publication: cleanSnippet(it['container-title']?.[0] || 'Crossref Journal'),
              year: it.published?.['date-parts']?.[0]?.[0] || 2024,
              url: it.URL || `https://doi.org/${it.DOI}`,
              doi: it.DOI,
              category: 'publications',
              repository: 'Crossref Live',
              text: abs.slice(0, 1200),
            });
          }
        } catch {}
      })()
    );

    tasks.push(
      (async () => {
        try {
          const r = await fetch(
            `https://doaj.org/api/search/articles/${encodeURIComponent(qPrimary.slice(0, 90))}?pageSize=5`,
            { signal: AbortSignal.timeout(5500) }
          );
          if (!r.ok) return;
          const j = await r.json();
          const items = j?.results || [];
          if (items.length > 0) apisSucceeded.add('DOAJ');
          for (const it of items) {
            const b = it.bibjson || {};
            const abs = cleanSnippet(b.abstract);
            if (abs.length < 40) continue;
            sources.push({
              id: `live-doaj-${String(it.id).slice(0, 32)}`,
              title: cleanSnippet(b.title || 'DOAJ Article'),
              authors:
                (b.author || [])
                  .slice(0, 3)
                  .map((a: { name?: string }) => a.name)
                  .filter(Boolean)
                  .join(', ') || 'DOAJ Authors',
              publication: cleanSnippet(b.journal?.title || 'DOAJ Journal'),
              year: Number(b.year) || 2024,
              url: b.link?.[0]?.url || 'https://doaj.org',
              category: 'publications',
              repository: 'DOAJ Live',
              text: abs.slice(0, 1200),
            });
          }
        } catch {}
      })()
    );

    tasks.push(
      (async () => {
        try {
          const r = await fetch(
            `https://api.datacite.org/dois?query=${encodeURIComponent(qPrimary.slice(0, 90))}&page[size]=5`,
            { signal: AbortSignal.timeout(5500) }
          );
          if (!r.ok) return;
          const j = await r.json();
          const items = j?.data || [];
          if (items.length > 0) apisSucceeded.add('DataCite');
          for (const d of items) {
            const attr = d.attributes || {};
            const desc = cleanSnippet(attr.descriptions?.[0]?.description);
            if (desc.length < 40) continue;
            sources.push({
              id: `live-dc-${String(d.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 42)}`,
              title: cleanSnippet(attr.titles?.[0]?.title || 'DataCite Work'),
              authors:
                (attr.creators || [])
                  .slice(0, 3)
                  .map((c: { name?: string }) => c.name)
                  .filter(Boolean)
                  .join(', ') || 'DataCite Authors',
              publication: cleanSnippet(attr.publisher || 'DataCite Repository'),
              year: Number(attr.publicationYear) || 2024,
              url: attr.url || `https://doi.org/${d.id}`,
              doi: d.id,
              category: 'student_papers',
              repository: 'DataCite Live',
              text: desc.slice(0, 1200),
            });
          }
        } catch {}
      })()
    );

    tasks.push(
      (async () => {
        try {
          const r = await fetch(
            `https://api.archives-ouvertes.fr/search/?q=${encodeURIComponent(qPrimary.slice(0, 90))}&fl=docid,title_s,authFullName_s,journalTitle_s,producedDateY_i,abstract_s,uri_s&wt=json&rows=5`,
            { signal: AbortSignal.timeout(5500) }
          );
          if (!r.ok) return;
          const j = await r.json();
          const docs = j?.response?.docs || [];
          if (docs.length > 0) apisSucceeded.add('HAL Archive');
          for (const d of docs) {
            const abs = cleanSnippet(Array.isArray(d.abstract_s) ? d.abstract_s[0] : d.abstract_s);
            if (abs.length < 40) continue;
            sources.push({
              id: `live-hal-${String(d.docid)}`,
              title: cleanSnippet(Array.isArray(d.title_s) ? d.title_s[0] : d.title_s || 'HAL Paper'),
              authors: (d.authFullName_s || []).slice(0, 3).join(', ') || 'HAL Authors',
              publication: cleanSnippet(d.journalTitle_s || 'HAL Open Archive'),
              year: Number(d.producedDateY_i) || 2024,
              url: d.uri_s || 'https://hal.science',
              category: d.journalTitle_s ? 'publications' : 'student_papers',
              repository: 'HAL Archive Live',
              text: abs.slice(0, 1200),
            });
          }
        } catch {}
      })()
    );

    // 6. OpenAlex Global Scholarly Graph (260M+ works, CORS enabled)
    tasks.push(
      (async () => {
        try {
          const r = await fetch(
            `https://api.openalex.org/works?search=${encodeURIComponent(qPrimary.slice(0, 90))}&per-page=5&select=id,doi,title,publication_year,authorships,primary_location,abstract_inverted_index`,
            { signal: AbortSignal.timeout(5500) }
          );
          if (!r.ok) return;
          const j = await r.json();
          const items = j?.results || [];
          let added = 0;
          for (const it of items) {
            const inv = it.abstract_inverted_index as Record<string, number[]> | undefined;
            if (!inv) continue;
            const words: string[] = [];
            for (const [word, positions] of Object.entries(inv)) {
              for (const pos of positions) words[pos] = word;
            }
            const abs = cleanSnippet(words.filter(Boolean).join(' '));
            if (abs.length < 40) continue;
            added++;
            sources.push({
              id: `live-oa-${String(it.id || added).split('/').pop()}`,
              title: cleanSnippet(it.title || 'OpenAlex Work'),
              authors:
                (it.authorships || [])
                  .slice(0, 3)
                  .map((a: { author?: { display_name?: string } }) => a.author?.display_name)
                  .filter(Boolean)
                  .join(', ') || 'OpenAlex Authors',
              publication: cleanSnippet(
                it.primary_location?.source?.display_name || 'OpenAlex Scholarly Index'
              ),
              year: Number(it.publication_year) || 2024,
              url: it.doi || it.id || 'https://openalex.org',
              doi: it.doi ? String(it.doi).replace(/^https?:\/\/doi\.org\//i, '') : undefined,
              category: 'publications',
              repository: 'OpenAlex Global Graph (260M+)',
              text: abs.slice(0, 1200),
            });
          }
          if (added > 0) apisSucceeded.add('OpenAlex');
        } catch {}
      })()
    );

    // 7. PLOS Open Access Peer-Reviewed Corpus (CORS enabled)
    tasks.push(
      (async () => {
        try {
          const r = await fetch(
            `https://api.plos.org/search?q=${encodeURIComponent(qPrimary.slice(0, 90))}&fl=id,title_display,author_display,journal,publication_date,abstract&wt=json&rows=5`,
            { signal: AbortSignal.timeout(5500) }
          );
          if (!r.ok) return;
          const j = await r.json();
          const docs = j?.response?.docs || [];
          if (docs.length > 0) apisSucceeded.add('PLOS');
          for (const d of docs) {
            const abs = cleanSnippet(Array.isArray(d.abstract) ? d.abstract.join(' ') : d.abstract);
            if (abs.length < 40) continue;
            sources.push({
              id: `live-plos-${String(d.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
              title: cleanSnippet(d.title_display || 'PLOS Article'),
              authors: (d.author_display || []).slice(0, 3).join(', ') || 'PLOS Authors',
              publication: cleanSnippet(d.journal || 'PLOS ONE'),
              year: Number(String(d.publication_date || '2024').slice(0, 4)) || 2024,
              url: `https://doi.org/${d.id}`,
              doi: d.id,
              category: 'publications',
              repository: 'PLOS Open Access Live',
              text: abs.slice(0, 1200),
            });
          }
        } catch {}
      })()
    );

    // 8. PubMed / MEDLINE Biomedical Index (38M+ citations, CORS enabled)
    tasks.push(
      (async () => {
        try {
          const sr = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=3&term=${encodeURIComponent(qPrimary.slice(0, 80))}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (!sr.ok) return;
          const sj = await sr.json();
          const ids: string[] = sj?.esearchresult?.idlist || [];
          if (!ids.length) return;
          const sm = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (!sm.ok) return;
          const smj = await sm.json();
          apisSucceeded.add('PubMed');
          for (const pmid of ids) {
            const rec = smj?.result?.[pmid];
            if (!rec?.title) continue;
            sources.push({
              id: `live-pm-${pmid}`,
              title: cleanSnippet(rec.title),
              authors:
                (rec.authors || [])
                  .slice(0, 3)
                  .map((a: { name?: string }) => a.name)
                  .filter(Boolean)
                  .join(', ') || 'PubMed Authors',
              publication: cleanSnippet(rec.fulljournalname || rec.source || 'PubMed MEDLINE'),
              year: Number(String(rec.pubdate || '2024').slice(0, 4)) || 2024,
              url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
              category: 'publications',
              repository: 'PubMed / MEDLINE Live',
              text: cleanSnippet(`${rec.title} ${rec.fulljournalname || ''}`),
            });
          }
        } catch {}
      })()
    );

    const shortWikiQ = qPrimary.split(/\s+/).slice(0, 4).join(' ');
    for (const lang of ['en', 'id'] as const) {
      tasks.push(
        (async () => {
          try {
            const base = `https://${lang}.wikipedia.org/w/api.php`;
            const sr = await fetch(
              `${base}?action=query&list=search&srsearch=${encodeURIComponent(shortWikiQ)}&srlimit=3&format=json&origin=*`,
              { signal: AbortSignal.timeout(4500) }
            );
            if (!sr.ok) return;
            const sj = await sr.json();
            const titles = (sj?.query?.search || []).map((x: { title: string }) => x.title);
            if (!titles.length) return;
            const er = await fetch(
              `${base}?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(titles.join('|'))}&format=json&origin=*`,
              { signal: AbortSignal.timeout(4500) }
            );
            if (!er.ok) return;
            const ej = await er.json();
            const pages = Object.values(ej?.query?.pages || {}) as Array<{
              pageid?: number;
              title?: string;
              extract?: string;
            }>;
            if (pages.length > 0) apisSucceeded.add(`Wikipedia ${lang.toUpperCase()}`);
            for (const p of pages) {
              const ext = cleanSnippet(p.extract || '');
              if (ext.length < 40 || !p.title) continue;
              sources.push({
                id: `live-wiki-${lang}-${p.pageid}`,
                title: cleanSnippet(p.title),
                authors: `Wikipedia ${lang.toUpperCase()} Contributors`,
                publication: `Wikipedia (${lang.toUpperCase()})`,
                year: 2025,
                url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
                category: 'internet',
                repository: `Wikipedia ${lang.toUpperCase()} Live`,
                text: ext.slice(0, 1200),
              });
            }
          } catch {}
        })()
      );
    }
  }

  await Promise.all(tasks);

  return {
    sources,
    apisSucceeded: Array.from(apisSucceeded),
    doisResolved,
  };
}

function crc32Browser(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXmlBrowser(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function concatUint8Arrays(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

/**
 * Generates a valid Microsoft Word OpenXML (.docx) Blob cleanly inside the browser
 * using Store-mode ZIP packaging with 0.000 ms Vercel Active CPU usage.
 */
export function createDocxBlobInBrowser(title: string, author: string, text: string): Blob {
  const enc = new TextEncoder();
  const paragraphs = text
    .split(/\n{2,}|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const bodyParagraphsXml = [
    `<w:p><w:r><w:t>${escapeXmlBrowser(title)}</w:t></w:r></w:p>`,
    `<w:p><w:r><w:t>Author: ${escapeXmlBrowser(author)}</w:t></w:r></w:p>`,
    ...paragraphs.map((p) => `<w:p><w:r><w:t>${escapeXmlBrowser(p)}</w:t></w:r></w:p>`),
  ].join('\n');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${bodyParagraphsXml}
  </w:body>
</w:document>`;

  const entries: Array<{ name: string; data: Uint8Array }> = [
    { name: '[Content_Types].xml', data: enc.encode(contentTypesXml) },
    { name: '_rels/.rels', data: enc.encode(relsXml) },
    { name: 'word/document.xml', data: enc.encode(documentXml) },
  ];

  const localParts: Uint8Array[] = [];
  const cdParts: Uint8Array[] = [];
  let offset = 0;

  for (const f of entries) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32Browser(f.data);

    const localBuf = new ArrayBuffer(30);
    const lv = new DataView(localBuf);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // Store mode (0)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, f.data.length, true);
    lv.setUint32(22, f.data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);

    const localEntry = concatUint8Arrays([new Uint8Array(localBuf), nameBytes, f.data]);
    localParts.push(localEntry);

    const cdBuf = new ArrayBuffer(46);
    const cv = new DataView(cdBuf);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true); // Store mode (0)
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, f.data.length, true);
    cv.setUint32(24, f.data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);

    cdParts.push(concatUint8Arrays([new Uint8Array(cdBuf), nameBytes]));
    offset += localEntry.length;
  }

  const cdMerged = concatUint8Arrays(cdParts);
  const eocdBuf = new ArrayBuffer(22);
  const ev = new DataView(eocdBuf);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdMerged.length, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const fullBytes = concatUint8Arrays([...localParts, cdMerged, new Uint8Array(eocdBuf)]);
  const safeCopy = new Uint8Array(fullBytes.byteLength);
  safeCopy.set(fullBytes);
  return new Blob([safeCopy], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}


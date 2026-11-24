import zlib from 'node:zlib';

export interface ParsedDocumentResult {
  fileName: string;
  fileType: 'pdf' | 'docx' | 'odt' | 'rtf' | 'tex' | 'html' | 'txt';
  byteSize: number;
  estimatedPages: number;
  wordCount: number;
  characterCount: number;
  extractedTitle: string;
  text: string;
  warnings: string[];
}

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

interface ZipEntry {
  fileName: string;
  compressionMethod: number;
  compressedData: Buffer;
}

/**
 * Pure Node/TypeScript PKZIP reader supporting both Central Directory (for streaming DOCX
 * with bit-3 data descriptors) and Local File Header traversal.
 */
function readZipEntries(buffer: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];

  // 1. Try locating End of Central Directory (EOCD: 0x06054b50) near the end of the file
  let eocdOffset = -1;
  const minEocdSearch = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= minEocdSearch; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
    const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
    let ptr = cdOffset;

    for (let idx = 0; idx < totalEntries && ptr + 46 <= buffer.length; idx++) {
      const sig = buffer.readUInt32LE(ptr);
      if (sig !== 0x02014b50) break;

      const compressionMethod = buffer.readUInt16LE(ptr + 10);
      const compressedSize = buffer.readUInt32LE(ptr + 20);
      const fileNameLen = buffer.readUInt16LE(ptr + 28);
      const extraLen = buffer.readUInt16LE(ptr + 30);
      const commentLen = buffer.readUInt16LE(ptr + 32);
      const localHeaderOffset = buffer.readUInt32LE(ptr + 42);

      const fileName = buffer
        .subarray(ptr + 46, ptr + 46 + fileNameLen)
        .toString('utf8');

      if (localHeaderOffset + 30 <= buffer.length) {
        const localSig = buffer.readUInt32LE(localHeaderOffset);
        if (localSig === 0x04034b50) {
          const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
          const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
          const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
          const dataEnd = Math.min(buffer.length, dataStart + compressedSize);
          entries.push({
            fileName,
            compressionMethod,
            compressedData: buffer.subarray(dataStart, dataEnd),
          });
        }
      }

      ptr += 46 + fileNameLen + extraLen + commentLen;
    }

    if (entries.length > 0) {
      return entries;
    }
  }

  // 2. Fallback: Sequential Local File Header scan (0x04034b50)
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const fileName = buffer
      .subarray(offset + 30, offset + 30 + fileNameLen)
      .toString('utf8');
    const dataStart = offset + 30 + fileNameLen + extraLen;
    if (compressedSize === 0 && offset > 0) break;
    const dataEnd = Math.min(buffer.length, dataStart + compressedSize);

    entries.push({
      fileName,
      compressionMethod,
      compressedData: buffer.subarray(dataStart, dataEnd),
    });

    offset = dataEnd;
  }

  return entries;
}

function decompressZipEntry(entry: ZipEntry): string {
  if (entry.compressionMethod === 0) {
    return entry.compressedData.toString('utf8');
  }
  if (entry.compressionMethod === 8) {
    return zlib.inflateRawSync(entry.compressedData).toString('utf8');
  }
  throw new Error(`Unsupported ZIP compression method: ${entry.compressionMethod}`);
}

/**
 * Extracts structured academic paragraphs from a .docx (Word OpenXML) or .odt archive.
 */
export function extractTextFromDocxBuffer(buffer: Buffer): {
  text: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const entries = readZipEntries(buffer);
  if (entries.length === 0) {
    throw new Error('Invalid or corrupted DOCX/ZIP container header.');
  }

  // Check for Word document.xml or OpenDocument content.xml
  const docEntry =
    entries.find((e) => e.fileName === 'word/document.xml') ||
    entries.find((e) => e.fileName.endsWith('document.xml')) ||
    entries.find((e) => e.fileName === 'content.xml');

  if (!docEntry) {
    throw new Error('Could not locate word/document.xml inside DOCX container.');
  }

  const xmlParts: string[] = [decompressZipEntry(docEntry)];

  // Include footnotes and endnotes if present in academic manuscripts
  for (const extraName of ['word/footnotes.xml', 'word/endnotes.xml']) {
    const extra = entries.find((e) => e.fileName === extraName);
    if (extra) {
      try {
        xmlParts.push(decompressZipEntry(extra));
      } catch {
        warnings.push(`Skipped unreadable ${extraName}`);
      }
    }
  }

  const paragraphs: string[] = [];

  for (const xml of xmlParts) {
    // Handle both Word <w:p> and OpenDocument <text:p>
    const pBlocks = xml.split(/<\/(?:w:p|text:p|text:h)>/i);
    for (const block of pBlocks) {
      if (!block.trim()) continue;
      const withBreaks = block
        .replace(/<(?:w:tab|text:tab)[^>]*\/?>/gi, '\t')
        .replace(/<(?:w:br|w:cr|text:line-break)[^>]*\/?>/gi, '\n');

      // Extract <w:t>...</w:t> runs, or fallback to stripping tags for ODT
      const runs: string[] = [];
      const wtRegex = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/gi;
      let match: RegExpExecArray | null;
      while ((match = wtRegex.exec(withBreaks)) !== null) {
        runs.push(decodeXmlEntities(match[1]));
      }

      if (runs.length > 0) {
        const line = runs.join('').replace(/\s+/g, ' ').trim();
        if (line) paragraphs.push(line);
      } else if (xml.includes('<text:')) {
        const stripped = decodeXmlEntities(withBreaks.replace(/<[^>]+>/g, ' '))
          .replace(/\s+/g, ' ')
          .trim();
        if (stripped) paragraphs.push(stripped);
      }
    }
  }

  return {
    text: paragraphs.join('\n\n').trim(),
    warnings,
  };
}

/**
 * Decodes a PDF literal string (...) handling octal escapes, standard escapes, and UTF-16BE BOM.
 */
function decodePdfLiteralString(raw: string): string {
  const bytes: number[] = [];
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '\\' && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (next >= '0' && next <= '7') {
        const oct = raw.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] || next;
        bytes.push(parseInt(oct, 8) & 0xff);
        i += 1 + oct.length;
        continue;
      }
      switch (next) {
        case 'n':
          bytes.push(10);
          i += 2;
          break;
        case 'r':
          bytes.push(13);
          i += 2;
          break;
        case 't':
          bytes.push(9);
          i += 2;
          break;
        case 'b':
          bytes.push(8);
          i += 2;
          break;
        case 'f':
          bytes.push(12);
          i += 2;
          break;
        case '(':
          bytes.push(40);
          i += 2;
          break;
        case ')':
          bytes.push(41);
          i += 2;
          break;
        case '\\':
          bytes.push(92);
          i += 2;
          break;
        case '\r':
          i += raw[i + 2] === '\n' ? 3 : 2;
          break;
        case '\n':
          i += 2;
          break;
        default:
          bytes.push(next.charCodeAt(0) & 0xff);
          i += 2;
          break;
      }
    } else {
      bytes.push(ch.charCodeAt(0) & 0xff);
      i++;
    }
  }

  // Check for UTF-16BE BOM (0xFE 0xFF)
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let out = '';
    for (let j = 2; j + 1 < bytes.length; j += 2) {
      const code = (bytes[j] << 8) | bytes[j + 1];
      if (code > 0) out += String.fromCharCode(code);
    }
    return out;
  }

  return bytes
    .map((b) => {
      // Map common WinAnsi smart quotes/dashes in PDFs
      if (b === 0x91 || b === 0x92) return "'";
      if (b === 0x93 || b === 0x94) return '"';
      if (b === 0x96 || b === 0x97) return '-';
      return String.fromCharCode(b);
    })
    .join('');
}

interface PdfCMapTables {
  cmap1Byte: Map<number, string>;
  cmap2Byte: Map<number, string>;
}

function decodeHexUtf16BeToString(dstHex: string): string {
  const clean = dstHex.replace(/\s+/g, '');
  let str = '';
  if (clean.length <= 2) {
    const cp = parseInt(clean, 16);
    if (Number.isFinite(cp) && cp > 0) return String.fromCodePoint(cp);
    return '';
  }
  for (let i = 0; i < clean.length; i += 4) {
    const chunk = clean.slice(i, i + 4);
    if (!chunk) continue;
    const cp = parseInt(chunk, 16);
    if (Number.isFinite(cp) && cp > 0) {
      str += String.fromCodePoint(cp);
    }
  }
  return str;
}

function parseToUnicodeCMap(streamText: string, tables: PdfCMapTables): void {
  // Parse beginbfchar ... endbfchar
  const bfcharRegex = /beginbfchar([\s\S]*?)endbfchar/g;
  let m: RegExpExecArray | null;
  while ((m = bfcharRegex.exec(streamText)) !== null) {
    const pairRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let p: RegExpExecArray | null;
    while ((p = pairRegex.exec(m[1])) !== null) {
      const srcHex = p[1];
      const srcCode = parseInt(srcHex, 16);
      const str = decodeHexUtf16BeToString(p[2]);
      if (str) {
        if (srcHex.length >= 4) {
          if (!tables.cmap2Byte.has(srcCode)) tables.cmap2Byte.set(srcCode, str);
        } else {
          if (!tables.cmap1Byte.has(srcCode)) tables.cmap1Byte.set(srcCode, str);
        }
      }
    }
  }

  // Parse beginbfrange ... endbfrange (both direct <dst> and array [<dst1> <dst2> ...] forms)
  const bfrangeRegex = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((m = bfrangeRegex.exec(streamText)) !== null) {
    const block = m[1];

    // Form 1: <start> <end> <targetStart>
    const directRangeRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let r: RegExpExecArray | null;
    while ((r = directRangeRegex.exec(block)) !== null) {
      const srcHex = r[1];
      const startCode = parseInt(srcHex, 16);
      const endCode = parseInt(r[2], 16);
      let targetCp = parseInt(r[3], 16);
      const targetMap = srcHex.length >= 4 ? tables.cmap2Byte : tables.cmap1Byte;
      if (endCode >= startCode && endCode - startCode <= 2048) {
        for (let c = startCode; c <= endCode; c++) {
          if (!targetMap.has(c) && targetCp > 0 && targetCp <= 0x10ffff) {
            targetMap.set(c, String.fromCodePoint(targetCp));
          }
          targetCp++;
        }
      }
    }

    // Form 2: <start> <end> [<dst1> <dst2> ...] (widely used by Word, Google Docs, Chrome PDF)
    const arrayRangeRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([^\]]+)\]/g;
    let ar: RegExpExecArray | null;
    while ((ar = arrayRangeRegex.exec(block)) !== null) {
      const srcHex = ar[1];
      const startCode = parseInt(srcHex, 16);
      const endCode = parseInt(ar[2], 16);
      const targetMap = srcHex.length >= 4 ? tables.cmap2Byte : tables.cmap1Byte;
      const dstHexMatches = ar[3].match(/<([0-9a-fA-F]+)>/g) || [];
      for (let idx = 0; idx < dstHexMatches.length; idx++) {
        const code = startCode + idx;
        if (code > endCode) break;
        const hexVal = dstHexMatches[idx].slice(1, -1);
        const str = decodeHexUtf16BeToString(hexVal);
        if (str && !targetMap.has(code)) {
          targetMap.set(code, str);
        }
      }
    }
  }
}

function decodePdfHexString(hex: string, tables: PdfCMapTables): string {
  const clean = hex.replace(/\s+/g, '');
  if (!clean) return '';

  // UTF-16BE BOM
  if (clean.length % 4 === 0 && clean.toUpperCase().startsWith('FEFF')) {
    let out = '';
    for (let i = 4; i < clean.length; i += 4) {
      const cp = parseInt(clean.slice(i, i + 4), 16);
      if (cp > 0) out += String.fromCharCode(cp);
    }
    return out;
  }

  // Use 4-hex-digit (2-byte) decoding whenever a 2-byte CMap exists and hex length is divisible by 4
  const use2Byte = clean.length % 4 === 0 && tables.cmap2Byte.size > 0;
  const step = use2Byte ? 4 : 2;
  const activeMap = use2Byte ? tables.cmap2Byte : tables.cmap1Byte;

  let out = '';
  for (let i = 0; i < clean.length; i += step) {
    const code = parseInt(clean.slice(i, i + step), 16);
    if (activeMap.has(code)) {
      out += activeMap.get(code)!;
    } else if (!use2Byte && tables.cmap2Byte.has(code)) {
      out += tables.cmap2Byte.get(code)!;
    } else if (code >= 32 && code <= 126) {
      out += String.fromCharCode(code);
    } else if (step === 4 && code >= 0x00a0 && code <= 0x024f) {
      out += String.fromCharCode(code);
    }
  }
  return out;
}

function decodeAscii85(raw: Buffer): Buffer | null {
  try {
    const str = raw.toString('latin1').replace(/\s+/g, '');
    const endIdx = str.indexOf('~>');
    const body = endIdx >= 0 ? str.slice(0, endIdx) : str;
    const out: number[] = [];
    let i = 0;
    while (i < body.length) {
      if (body[i] === 'z') {
        out.push(0, 0, 0, 0);
        i++;
        continue;
      }
      const chunk = body.slice(i, i + 5);
      if (!chunk.length) break;
      const pad = 5 - chunk.length;
      const padded = chunk + 'u'.repeat(pad);
      let val = 0;
      for (let k = 0; k < 5; k++) {
        val = val * 85 + (padded.charCodeAt(k) - 33);
      }
      const bytes = [(val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, val & 0xff];
      for (let b = 0; b < 4 - pad; b++) out.push(bytes[b]);
      i += chunk.length;
    }
    return Buffer.from(out);
  } catch {
    return null;
  }
}

/**
 * Extracts text from a PDF buffer by decompressing FlateDecode / ASCII85 streams,
 * applying 1-byte and 2-byte Identity-H ToUnicode CMaps (both bfchar & bfrange array forms),
 * and parsing BT..ET text blocks (Tj, TJ, ', ", Td, TD, T*, Tm).
 */
export function extractTextFromPdfBuffer(buffer: Buffer): {
  text: string;
  pageCount: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  const rawLatin1 = buffer.toString('latin1');
  const isEncryptedPdf = /\/Encrypt\s+\d+\s+\d+\s+R|\/Encrypt\s*<</.test(rawLatin1);

  // Estimate page count from /Type /Page (not /Pages)
  const pageMatches = rawLatin1.match(/\/Type\s*\/Page\b(?!s)/g);
  const pageCount = Math.max(1, pageMatches ? pageMatches.length : 1);

  const decodedStreams: string[] = [];
  const cmapTables: PdfCMapTables = {
    cmap1Byte: new Map<number, string>(),
    cmap2Byte: new Map<number, string>(),
  };
  let imageStreamCount = 0;

  // Locate all stream ... endstream blocks
  let searchPos = 0;
  while (searchPos < rawLatin1.length) {
    const streamIdx = rawLatin1.indexOf('stream', searchPos);
    if (streamIdx === -1) break;

    // Ensure "stream" is not part of "endstream"
    if (streamIdx >= 3 && rawLatin1.slice(streamIdx - 3, streamIdx) === 'end') {
      searchPos = streamIdx + 6;
      continue;
    }

    let dataStart = streamIdx + 6;
    if (rawLatin1[dataStart] === '\r' && rawLatin1[dataStart + 1] === '\n') {
      dataStart += 2;
    } else if (rawLatin1[dataStart] === '\n' || rawLatin1[dataStart] === '\r') {
      dataStart += 1;
    } else {
      searchPos = streamIdx + 6;
      continue;
    }

    const endStreamIdx = rawLatin1.indexOf('endstream', dataStart);
    if (endStreamIdx === -1) break;

    let dataEnd = endStreamIdx;
    if (rawLatin1[dataEnd - 2] === '\r' && rawLatin1[dataEnd - 1] === '\n') {
      dataEnd -= 2;
    } else if (rawLatin1[dataEnd - 1] === '\n' || rawLatin1[dataEnd - 1] === '\r') {
      dataEnd -= 1;
    }

    // Check object header preceding stream (1024-byte lookback handles long Word/Acrobat stream dictionaries)
    const headerSlice = rawLatin1.slice(Math.max(0, streamIdx - 1024), streamIdx);
    const isImage = /\/Subtype\s*\/Image\b/.test(headerSlice);
    if (isImage) {
      imageStreamCount++;
    }

    if (!isImage && dataEnd > dataStart) {
      let rawSlice: Buffer = buffer.subarray(dataStart, dataEnd);
      const isAscii85 = /\/ASCII85Decode\b/.test(headerSlice);
      if (isAscii85) {
        const decoded85 = decodeAscii85(rawSlice);
        if (decoded85) rawSlice = decoded85;
      }

      const hasZlibMagic =
        rawSlice.length >= 2 &&
        rawSlice[0] === 0x78 &&
        (rawSlice[1] === 0x9c || rawSlice[1] === 0x01 || rawSlice[1] === 0xda || rawSlice[1] === 0x5e);
      const isFlate = /\/FlateDecode\b/.test(headerSlice) || hasZlibMagic;

      let streamStr = '';
      if (isFlate) {
        try {
          streamStr = zlib.inflateSync(rawSlice).toString('latin1');
        } catch {
          try {
            streamStr = zlib.inflateRawSync(rawSlice).toString('latin1');
          } catch {
            // Unreadable binary stream
          }
        }
      } else {
        streamStr = rawSlice.toString('latin1');
      }

      if (streamStr) {
        if (streamStr.includes('beginbfchar') || streamStr.includes('beginbfrange')) {
          parseToUnicodeCMap(streamStr, cmapTables);
        } else {
          decodedStreams.push(streamStr);
        }
      }
    }

    searchPos = endStreamIdx + 9;
  }

  const lines: string[] = [];

  for (const content of decodedStreams) {
    if (!content.includes('BT') && !content.includes('Tj') && !content.includes('TJ')) {
      continue;
    }

    let currentLine = '';
    let lastTmY: number | null = null;

    // Tokenize PDF text operators across the stream without cutting on "ET" inside words
    const tokenRegex =
      /(\[(?:[^\[\]]|\((?:\\.|[^\\()])*\))*\]\s*TJ|\((?:\\.|[^\\()])*\)\s*(?:Tj|'|")|<[0-9a-fA-F\s]+>\s*(?:Tj|'|")|-?\d+(?:\.\d+)?\s+(-?\d+(?:\.\d+)?)\s+T[dD]|(?:-?\d+(?:\.\d+)?\s+){5}(-?\d+(?:\.\d+)?)\s+Tm|\bT\*\b|\bET\b)/g;

    let tok: RegExpExecArray | null;
    while ((tok = tokenRegex.exec(content)) !== null) {
      const full = tok[1];

      if (full === 'T*' || full === 'ET') {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = '';
        continue;
      }

      if (tok[3] !== undefined && full.endsWith('Tm')) {
        const tmY = parseFloat(tok[3]);
        if (lastTmY !== null && Math.abs(tmY - lastTmY) > 2.0) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = '';
          // Insert blank line marker on larger vertical paragraph/heading gaps
          if (Math.abs(tmY - lastTmY) > 18) {
            lines.push('');
          }
        } else if (currentLine && !currentLine.endsWith(' ')) {
          currentLine += ' ';
        }
        lastTmY = tmY;
        continue;
      }

      if (tok[2] !== undefined && /T[dD]$/.test(full)) {
        const dy = parseFloat(tok[2]);
        if (Math.abs(dy) > 2.0) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = '';
          if (Math.abs(dy) > 18) {
            lines.push('');
          }
        } else if (currentLine && !currentLine.endsWith(' ')) {
          currentLine += ' ';
        }
        continue;
      }

      if (full.endsWith('TJ')) {
        // Array of strings and kerning numbers: [(Hello) -20 (world)] TJ or [<0024> -20 <0041>] TJ
        const innerRegex = /\(((?:\\.|[^\\()])*)\)|<([0-9a-fA-F\s]+)>|(-?\d+(?:\.\d+)?)/g;
        let part: RegExpExecArray | null;
        while ((part = innerRegex.exec(full)) !== null) {
          if (part[1] !== undefined) {
            currentLine += decodePdfLiteralString(part[1]);
          } else if (part[2] !== undefined) {
            currentLine += decodePdfHexString(part[2], cmapTables);
          } else if (part[3] !== undefined) {
            const kern = parseFloat(part[3]);
            if (kern <= -65 && !currentLine.endsWith(' ')) {
              currentLine += ' ';
            }
          }
        }
      } else if (full.startsWith('<')) {
        const hexMatch = full.match(/^<([0-9a-fA-F\s]+)>/);
        if (hexMatch) {
          currentLine += decodePdfHexString(hexMatch[1], cmapTables);
        }
      } else {
        const litMatch = full.match(/^\(((?:\\.|[^\\()])*)\)/);
        if (litMatch) {
          currentLine += decodePdfLiteralString(litMatch[1]);
        }
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
  }

  // Group extracted PDF lines into clean paragraphs while preserving headings and Daftar Pustaka / References
  const HEADING_REGEX =
    /^(?:BAB\s+[IVX0-9]+|\d+(?:\.\d+)*\s+[A-Z]|Daftar\s+Pustaka|References|Bibliography|Bibliografi|Works\s+Cited|Abstrak|Abstract|Pendahuluan|Introduction|Tinjauan\s+Pustaka|Landasan\s+Teori|Metode\s+Penelitian|Hasil\s+dan\s+Pembahasan|Kesimpulan|Penutup|\[\d+\])/i;

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
    if (!buf) {
      buf = line;
    } else if (HEADING_REGEX.test(line)) {
      paragraphs.push(buf);
      buf = line;
    } else if (HEADING_REGEX.test(buf) && buf.length < 90) {
      paragraphs.push(buf);
      buf = line;
    } else if (buf.endsWith('-')) {
      buf = buf.slice(0, -1) + line;
    } else if (/[.!?"]$/.test(buf) && (line.length < 75 || /^[A-Z0-9"“(\[]/.test(line))) {
      paragraphs.push(buf);
      buf = line;
    } else {
      buf += ' ' + line;
    }
  }
  if (buf) paragraphs.push(buf);

  const finalText = paragraphs.join('\n\n').trim();
  if (!finalText) {
    if (isEncryptedPdf) {
      warnings.push(
        'This PDF is encrypted or password-protected. Remove PDF security or export as an unprotected .PDF / .DOCX before uploading.'
      );
    } else if (imageStreamCount > 0) {
      warnings.push(
        `This PDF contains ${imageStreamCount} raster image stream(s) without an embedded text layer (scanned PDF). Upload the original .DOCX, run OCR first, or paste the text directly in Edit Mode.`
      );
    } else {
      warnings.push(
        'No extractable text layer was found in this PDF. Upload the original .DOCX or paste the manuscript text directly in Edit Mode.'
      );
    }
  }

  return {
    text: finalText,
    pageCount,
    warnings,
  };
}

/**
 * Extracts plain text from Rich Text Format (.rtf) files.
 */
export function extractTextFromRtf(rtf: string): string {
  return rtf
    .replace(/\\par\b|\\line\b/g, '\n\n')
    .replace(/\\tab\b/g, '\t')
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u(-?\d+)\??/g, (_, dec) => {
      const c = parseInt(dec, 10);
      return String.fromCharCode(c < 0 ? c + 65536 : c);
    })
    .replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|pict)[\s\S]*?\}/g, '')
    .replace(/\\[a-zA-Z]+-?\d*\s?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Universal server/node document parser for .pdf, .docx, .odt, .rtf, .tex, .html, .md, and .txt.
 */
export function parseDocumentBuffer(
  fileName: string,
  buffer: Buffer
): ParsedDocumentResult {
  const lower = fileName.toLowerCase();
  const baseTitle = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  let fileType: ParsedDocumentResult['fileType'] = 'txt';
  let text = '';
  let estimatedPages = 1;
  let warnings: string[] = [];

  // Detect by magic bytes or extension
  const isPdfMagic = buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF';
  const isZipMagic =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  if (lower.endsWith('.pdf') || isPdfMagic) {
    fileType = 'pdf';
    const res = extractTextFromPdfBuffer(buffer);
    text = res.text;
    estimatedPages = res.pageCount;
    warnings = res.warnings;
  } else if (lower.endsWith('.docx') || lower.endsWith('.odt') || isZipMagic) {
    fileType = lower.endsWith('.odt') ? 'odt' : 'docx';
    const res = extractTextFromDocxBuffer(buffer);
    text = res.text;
    warnings = res.warnings;
    estimatedPages = Math.max(1, Math.ceil(text.split(/\s+/).length / 280));
  } else if (lower.endsWith('.rtf') || buffer.subarray(0, 5).toString('ascii') === '{\\rtf') {
    fileType = 'rtf';
    text = extractTextFromRtf(buffer.toString('latin1'));
    estimatedPages = Math.max(1, Math.ceil(text.split(/\s+/).length / 280));
  } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    fileType = 'html';
    const rawHtml = buffer.toString('utf8');
    text = decodeXmlEntities(
      rawHtml
        .replace(/<(?:script|style)[\s\S]*?<\/(?:script|style)>/gi, ' ')
        .replace(/<\/(?:p|div|h[1-6]|li|tr|section|article)>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
    )
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    estimatedPages = Math.max(1, Math.ceil(text.split(/\s+/).length / 280));
  } else {
    fileType = lower.endsWith('.tex') ? 'tex' : 'txt';
    text = buffer.toString('utf8').replace(/\r\n/g, '\n').trim();
    estimatedPages = Math.max(1, Math.ceil(text.split(/\s+/).length / 280));
  }

  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

  return {
    fileName,
    fileType,
    byteSize: buffer.length,
    estimatedPages,
    wordCount: words,
    characterCount: text.length,
    extractedTitle: baseTitle || 'Uploaded Manuscript',
    text: text.slice(0, 180000),
    warnings,
  };
}

/**
 * Pure TypeScript CRC-32 implementation for generating valid .docx ZIP containers.
 */
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a valid Microsoft Word OpenXML (.docx) binary buffer from title, author, and text.
 */
export function createDocxBuffer(title: string, author: string, text: string): Buffer {
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
    `<w:p><w:r><w:t>${escapeXml(title)}</w:t></w:r></w:p>`,
    `<w:p><w:r><w:t>Author: ${escapeXml(author)}</w:t></w:r></w:p>`,
    ...paragraphs.map((p) => `<w:p><w:r><w:t>${escapeXml(p)}</w:t></w:r></w:p>`),
  ].join('\n');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${bodyParagraphsXml}
  </w:body>
</w:document>`;

  const files: Array<{ name: string; data: Buffer }> = [
    { name: '[Content_Types].xml', data: Buffer.from(contentTypesXml, 'utf8') },
    { name: '_rels/.rels', data: Buffer.from(relsXml, 'utf8') },
    { name: 'word/document.xml', data: Buffer.from(documentXml, 'utf8') },
  ];

  const localParts: Buffer[] = [];
  const cdParts: Buffer[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const compressed = zlib.deflateRawSync(f.data);
    const crc = crc32(f.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Signature
    localHeader.writeUInt16LE(20, 4); // Version needed
    localHeader.writeUInt16LE(0, 6); // Flags
    localHeader.writeUInt16LE(8, 8); // Compression: deflate (8)
    localHeader.writeUInt16LE(0, 10); // Mod time
    localHeader.writeUInt16LE(0, 12); // Mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(f.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const localEntry = Buffer.concat([localHeader, nameBuf, compressed]);
    localParts.push(localEntry);

    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0); // CD Signature
    cdHeader.writeUInt16LE(20, 4); // Version made by
    cdHeader.writeUInt16LE(20, 6); // Version needed
    cdHeader.writeUInt16LE(0, 8); // Flags
    cdHeader.writeUInt16LE(8, 10); // Compression: deflate (8)
    cdHeader.writeUInt16LE(0, 12);
    cdHeader.writeUInt16LE(0, 14);
    cdHeader.writeUInt32LE(crc, 16);
    cdHeader.writeUInt32LE(compressed.length, 20);
    cdHeader.writeUInt32LE(f.data.length, 24);
    cdHeader.writeUInt16LE(nameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30);
    cdHeader.writeUInt16LE(0, 32);
    cdHeader.writeUInt16LE(0, 34);
    cdHeader.writeUInt16LE(0, 36);
    cdHeader.writeUInt32LE(0, 38);
    cdHeader.writeUInt32LE(offset, 42);

    cdParts.push(Buffer.concat([cdHeader, nameBuf]));
    offset += localEntry.length;
  }

  const cdBuffer = Buffer.concat(cdParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, cdBuffer, eocd]);
}

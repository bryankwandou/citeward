import { IntegrityAuditResult } from './similarity-engine';

function escapePdfText(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generates a valid, standards-compliant PDF 1.4 document binary (%PDF-1.4)
 * containing the Citeward Similarity, Stylometric Cadence, and Solana Devnet
 * Attestation Receipt with zero external dependencies.
 */
export function generateAuditPdfBlob(params: {
  title: string;
  author: string;
  audit: IntegrityAuditResult;
  solanaSignature?: string;
  solanaExplorerUrl?: string;
}): Blob {
  const { title, author, audit, solanaSignature, solanaExplorerUrl } = params;

  const lines: Array<{ text: string; size: number; bold?: boolean; y: number }> = [];
  let y = 780;

  const pushLine = (text: string, size = 10, bold = false, step = 15) => {
    lines.push({ text: escapePdfText(text), size, bold, y });
    y -= step;
  };

  pushLine('CITEWARD TURNITIN-CALIBRATED ORIGINALITY & DIGITAL RECEIPT', 13.5, true, 20);
  pushLine(
    `Generated: ${audit.analyzedAt} | Engine: Rabin-Karp Winnowing (k=15, w=10) + 3-Gram MinHash`,
    9,
    false,
    18
  );
  pushLine('--------------------------------------------------------------------------------', 9, false, 16);
  pushLine(`Manuscript Title: ${title.slice(0, 72)}`, 11, true, 15);
  pushLine(`Author / Context: ${author.slice(0, 72)}`, 10, false, 15);
  pushLine(`Normalized SHA-256: ${audit.documentHashSha256}`, 9, false, 20);

  pushLine('1. TURNITIN-EQUIVALENT SIMILARITY & AI WRITING SUMMARY', 11, true, 16);
  const roundedSim =
    typeof audit.roundedSimilarityPercent === 'number'
      ? audit.roundedSimilarityPercent
      : audit.matchedWords === 0
      ? 0
      : Math.max(1, Math.round(audit.overallSimilarityPercent));
  pushLine(
    `   Similarity Index:     ${roundedSim}% (Exact: ${audit.overallSimilarityPercent}% | ${audit.matchedWords} / ${audit.evaluableWords} words)`,
    10,
    true,
    14
  );
  pushLine(
    `   Source Channels:      Internet ${audit.internetPercent}% | Publications ${audit.publicationsPercent}% | Student Papers ${audit.studentPapersPercent}%`,
    9.5,
    false,
    14
  );
  pushLine(
    `   Exclusions Applied:   Quotes=${audit.exclusions.excludeQuotes ? 'EXCLUDED' : 'INCLUDED'} (${audit.quotedWords}w) | Bib=${audit.exclusions.excludeBibliography ? 'EXCLUDED' : 'INCLUDED'} (${audit.bibliographyWords}w) | MinWords=${audit.exclusions.minWordMatch}w | MinSource=${audit.exclusions.minPercentMatch ?? 0}%`,
    8.5,
    false,
    14
  );
  const aiInd = audit.stylometry.turnitinAiIndicator || `${Math.round(audit.stylometry.overallAiPercent)}%`;
  pushLine(
    `   AI Writing Indicator: ${aiInd} (Est. ${audit.stylometry.overallAiPercent}% | ${audit.stylometry.qualifyingAiWords ?? audit.totalWords}w prose) | Burstiness CV: ${audit.stylometry.burstinessScore}`,
    9.5,
    false,
    20
  );

  pushLine('2. PRIMARY SOURCES MATCH OVERVIEW', 11, true, 16);
  if (audit.sources.length === 0) {
    pushLine('   No overlapping sources exceeded the active exclusion threshold.', 9.5, false, 18);
  } else {
    for (const s of audit.sources.slice(0, 10)) {
      if (y < 110) break;
      const pPct =
        typeof s.primarySimilarityPercent === 'number'
          ? s.primarySimilarityPercent
          : s.similarityPercent;
      const pWords =
        typeof s.primaryMatchedWords === 'number'
          ? s.primaryMatchedWords
          : s.matchedWords;
      const pRounded = pWords === 0 ? 0 : Math.max(1, Math.round(pPct));
      pushLine(
        `   #${s.rank} [${pRounded}% (${pPct}%) | ${pWords}w primary] ${s.source.title.slice(0, 56)}`,
        9.5,
        true,
        13
      );
      pushLine(
        `       ${s.source.authors} (${s.source.year}) - ${s.source.repository} - ${s.source.url.slice(0, 56)}`,
        8.5,
        false,
        15
      );
    }
  }

  y -= 6;
  pushLine('3. VERIFIABLE DIGITAL RECEIPT & OPTIONAL TIMESTAMP', 11, true, 16);
  if (solanaSignature) {
    pushLine(`   Confirmed SPL Memo Signature: ${solanaSignature}`, 9, true, 14);
    pushLine(`   Solscan Devnet URL: ${solanaExplorerUrl || ''}`, 8.5, false, 14);
  } else {
    pushLine(
      '   Inspect SHA-256 digest or anchor optional Devnet receipt at https://citeward.vercel.app/verify',
      9,
      false,
      14
    );
  }

  // Construct PDF content stream
  const streamOps: string[] = ['BT'];
  for (const ln of lines) {
    const fontKey = ln.bold ? '/F2' : '/F1';
    streamOps.push(`${fontKey} ${ln.size} Tf`);
    streamOps.push(`1 0 0 1 42 ${ln.y} Tm`);
    streamOps.push(`(${ln.text}) Tj`);
  }
  streamOps.push('ET');
  const streamContent = streamOps.join('\n');

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj'
  );
  objects.push(
    `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
  );
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj'
  );
  objects.push(
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj'
  );

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}


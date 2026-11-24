import zlib from 'node:zlib';
import {
  GLOBAL_TURNITIN_CORPUS_200,
  GLOBAL_TURNITIN_CORPUS_500,
  SAMPLE_MANUSCRIPTS,
} from '../src/lib/corpus';
import { runHeadToHead20BenchmarkSuite } from '../src/lib/head-to-head-benchmark';
import {
  extractBibliographyQueries,
  extractCitedDois,
  extractCitedUrls,
  extractSearchQueries,
} from '../src/lib/live-sources';
import {
  computeWinnowFingerprints,
  runManuscriptAudit,
} from '../src/lib/similarity-engine';
import {
  analyzeAiTells,
  humanizeAndParaphraseDeterministically,
  scanDocumentManipulations,
} from '../src/lib/forensics-and-ecosystem';
import {
  createDocxBuffer,
  parseDocumentBuffer,
} from '../src/lib/document-parser';
import { generateAuditPdfBlob } from '../src/lib/pdf-report';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
}

async function main() {
  console.log('=== 1. Verifying Winnowing Determinism & Substring Guarantee ===');
  const sampleText = SAMPLE_MANUSCRIPTS[0].text;
  const fp1 = computeWinnowFingerprints(sampleText, 15, 10);
  const fp2 = computeWinnowFingerprints(sampleText, 15, 10);
  assert(fp1.length > 20, `Expected >20 winnow fingerprints, got ${fp1.length}`);
  assert(
    fp1.every((f, idx) => f.hash === fp2[idx].hash && f.charPos === fp2[idx].charPos),
    'Winnowing fingerprints must be 100% deterministic across runs'
  );
  console.log(`[PASS] Winnowing produced ${fp1.length} deterministic fingerprints.`);

  console.log('=== 2. Verifying Turnitin Exclusion Calibration & Denominators ===');
  const auditIncluded = runManuscriptAudit(SAMPLE_MANUSCRIPTS[0].text, {
    excludeQuotes: false,
    excludeBibliography: false,
    minWordMatch: 8,
  });
  const auditExcluded = runManuscriptAudit(SAMPLE_MANUSCRIPTS[0].text, {
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
  });

  assert(
    auditIncluded.overallSimilarityPercent > auditExcluded.overallSimilarityPercent,
    'Excluding quotes and bibliography must reduce overall similarity percentage on Sample 01'
  );
  console.log(
    `[PASS] Sample 01 Similarity (Unfiltered): ${auditIncluded.overallSimilarityPercent}% | (Quotes+Bib Excluded): ${auditExcluded.overallSimilarityPercent}%`
  );

  console.log('=== 3. Verifying Stylometric Burstiness & Synthetic Discrimination ===');
  const syntheticAudit = runManuscriptAudit(SAMPLE_MANUSCRIPTS[1].text);
  const humanAudit = runManuscriptAudit(SAMPLE_MANUSCRIPTS[2].text);

  assert(
    syntheticAudit.stylometry.overallAiPercent >= 60,
    `Expected synthetic control AI% >= 60%, got ${syntheticAudit.stylometry.overallAiPercent}%`
  );
  assert(
    humanAudit.stylometry.overallAiPercent <= 25,
    `Expected human empirical manuscript AI% <= 25%, got ${humanAudit.stylometry.overallAiPercent}%`
  );
  assert(
    humanAudit.stylometry.burstinessScore > syntheticAudit.stylometry.burstinessScore,
    `Expected human burstiness (${humanAudit.stylometry.burstinessScore}) > synthetic burstiness (${syntheticAudit.stylometry.burstinessScore})`
  );
  console.log(
    `[PASS] Stylometric Separation: Synthetic AI=${syntheticAudit.stylometry.overallAiPercent}% (CV=${syntheticAudit.stylometry.burstinessScore}) vs Human Empirical AI=${humanAudit.stylometry.overallAiPercent}% (CV=${humanAudit.stylometry.burstinessScore})`
  );

  console.log('=== 4. Verifying Homoglyph Trap & Natural Human Paraphraser (<5% Sim) ===');
  const spoofed = 'Digit\u0430l d\u043Ecuments\u200B \u0430re copied.';
  const manip = scanDocumentManipulations(spoofed);
  assert(
    manip.homoglyphCount === 3 && manip.zeroWidthCount === 1,
    `Expected 3 homoglyphs and 1 zero-width char, got ${manip.homoglyphCount} and ${manip.zeroWidthCount}`
  );

  const rewritten = humanizeAndParaphraseDeterministically(SAMPLE_MANUSCRIPTS[1].text);
  const rewrittenTells = analyzeAiTells(rewritten);
  const rewrittenAudit = runManuscriptAudit(rewritten);
  assert(
    rewrittenTells.tells.length === 0,
    `Expected 0 AI tells after deterministic humanization, got ${rewrittenTells.tells.length}`
  );
  assert(
    rewrittenAudit.overallSimilarityPercent < 5.0,
    `Expected < 5.0% similarity after paraphrase, got ${rewrittenAudit.overallSimilarityPercent}%`
  );
  console.log(
    `[PASS] Homoglyph Trap & Human Paraphraser: 0 AI tells, ${rewrittenAudit.overallSimilarityPercent}% similarity (<5% SLA), Burstiness CV=${rewrittenAudit.stylometry.burstinessScore}`
  );

  console.log('=== 5. Verifying Binary .DOCX & .PDF Document Upload Extraction ===');
  const docxBuf = createDocxBuffer(
    SAMPLE_MANUSCRIPTS[0].title,
    SAMPLE_MANUSCRIPTS[0].author,
    SAMPLE_MANUSCRIPTS[0].text
  );
  const parsedDocx = parseDocumentBuffer('thesis-draft.docx', docxBuf);
  assert(
    parsedDocx.fileType === 'docx' && parsedDocx.wordCount >= 180,
    `Expected DOCX extraction >= 180 words, got ${parsedDocx.wordCount}`
  );
  const docxAudit = runManuscriptAudit(parsedDocx.text);
  assert(
    docxAudit.overallSimilarityPercent >= 35,
    `Expected extracted DOCX similarity >= 35%, got ${docxAudit.overallSimilarityPercent}%`
  );

  const pdfBlob = generateAuditPdfBlob({
    title: SAMPLE_MANUSCRIPTS[0].title,
    author: SAMPLE_MANUSCRIPTS[0].author,
    audit: auditExcluded,
  });
  const pdfArrayBuf = await pdfBlob.arrayBuffer();
  const parsedPdf = parseDocumentBuffer('audit-receipt.pdf', Buffer.from(pdfArrayBuf));
  assert(
    parsedPdf.fileType === 'pdf' && parsedPdf.wordCount >= 40,
    `Expected PDF extraction >= 40 words, got ${parsedPdf.wordCount}`
  );

  // Verify FlateDecode + 2-byte Identity-H CMap (beginbfrange array syntax, cmap.size < 256) Word/Chrome PDF extraction
  const cmapStream = zlib.deflateSync(
    Buffer.from(
      'beginbfrange\n<0003> <0006> [<0054> <0045> <0053> <0054>]\nendbfrange\nbeginbfchar\n<0007> <0020>\n<0008> <0050>\n<0009> <0044>\n<000A> <0046>\nendbfchar',
      'latin1'
    )
  );
  const contentStream = zlib.deflateSync(
    Buffer.from('BT /F1 12 Tf [<0003000400050006000700080009000A>] TJ ET', 'latin1')
  );
  const syntheticIdentityHPdf = Buffer.concat([
    Buffer.from('%PDF-1.7\n1 0 obj << /Type /Page /Filter /FlateDecode >> stream\n', 'latin1'),
    cmapStream,
    Buffer.from('\nendstream\nendobj\n2 0 obj << /Filter /FlateDecode >> stream\n', 'latin1'),
    contentStream,
    Buffer.from('\nendstream\nendobj\n%%EOF', 'latin1'),
  ]);
  const parsedIdentityHPdf = parseDocumentBuffer('word-identity-h.pdf', syntheticIdentityHPdf);
  assert(
    parsedIdentityHPdf.text.includes('TEST PDF'),
    `Expected FlateDecode 2-byte Identity-H PDF to decode 'TEST PDF', got '${parsedIdentityHPdf.text}'`
  );
  console.log(
    `[PASS] Binary .DOCX (${parsedDocx.wordCount}w, Sim=${docxAudit.overallSimilarityPercent}%) & .PDF (${parsedPdf.wordCount}w + Identity-H CMap) upload extraction verified.`
  );

  console.log('=== 6. Verifying Exact 0.0% Turnitin Parity Across All 5 Samples, Per-Source Union & DOI Query Extraction ===');
  for (const sample of SAMPLE_MANUSCRIPTS) {
    const rawAudit = runManuscriptAudit(sample.text, {
      excludeQuotes: false,
      excludeBibliography: false,
      minWordMatch: 8,
    });
    const excAudit = runManuscriptAudit(sample.text, {
      excludeQuotes: true,
      excludeBibliography: true,
      minWordMatch: 8,
    });
    const rawDelta = Math.abs(rawAudit.overallSimilarityPercent - sample.expectedTurnitinSimilarity);
    const excDelta = Math.abs(excAudit.overallSimilarityPercent - sample.expectedExcludedSimilarity);
    assert(
      rawDelta === 0,
      `Sample ${sample.id} Raw expected ${sample.expectedTurnitinSimilarity}%, got ${rawAudit.overallSimilarityPercent}%`
    );
    assert(
      excDelta === 0,
      `Sample ${sample.id} Excluded expected ${sample.expectedExcludedSimilarity}%, got ${excAudit.overallSimilarityPercent}%`
    );

    const primarySum = excAudit.sources.reduce((acc, s) => acc + s.primaryMatchedWords, 0);
    assert(
      primarySum === excAudit.matchedWords,
      `Sample ${sample.id} primary sum (${primarySum}) must equal matched union (${excAudit.matchedWords})`
    );
  }

  // Verify Per-Source Exclusion recalculates true set union without overcounting
  const baseAudit = runManuscriptAudit(SAMPLE_MANUSCRIPTS[0].text, {
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
  });
  const withoutTop1 = runManuscriptAudit(
    SAMPLE_MANUSCRIPTS[0].text,
    {
      excludeQuotes: true,
      excludeBibliography: true,
      minWordMatch: 8,
    },
    [],
    [baseAudit.sources[0].source.id]
  );
  assert(
    withoutTop1.sources.length === baseAudit.sources.length - 1,
    'Excluding top source must drop source count by 1'
  );
  assert(
    withoutTop1.overallSimilarityPercent < baseAudit.overallSimilarityPercent,
    'Excluding top source must lower overall union similarity'
  );
  const withoutTop1PrimarySum = withoutTop1.sources.reduce(
    (acc, s) => acc + s.primaryMatchedWords,
    0
  );
  assert(
    withoutTop1PrimarySum === withoutTop1.matchedWords,
    `Excluded-source primary sum (${withoutTop1PrimarySum}) must match union (${withoutTop1.matchedWords})`
  );

  // Verify denominatorMode = 'evaluable' excludes quoted & bibliography words from denominator
  const evaluableDenomAudit = runManuscriptAudit(SAMPLE_MANUSCRIPTS[0].text, {
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
    denominatorMode: 'evaluable',
  });
  const expectedEvaluable =
    baseAudit.totalWords - baseAudit.quotedWords - baseAudit.bibliographyWords;
  assert(
    evaluableDenomAudit.evaluableWords === expectedEvaluable &&
    evaluableDenomAudit.overallSimilarityPercent > baseAudit.overallSimilarityPercent,
    `Expected evaluable denominator=${expectedEvaluable} and higher ratio, got ${evaluableDenomAudit.evaluableWords} (${evaluableDenomAudit.overallSimilarityPercent}%)`
  );

  // Verify live query extraction finds explicit DOIs & distributed chunks across multi-paragraph papers
  const sectionTopics = [
    'Evaluasi pengelolaan portofolio akademik mahasiswa berbasis sistem informasi terdistribusi pada perguruan tinggi menunjukkan peningkatan efisiensi arsip.',
    'Implementasi algoritma Rabin-Karp rolling hash bersama teknik Winnowing window menjamin deteksi kecocokan n-gram karakter deterministik secara konsisten.',
    'Arsitektur indeks terbuka memadukan repositori Crossref OpenAlex DOAJ serta korpus ensiklopedis multibahasa guna memetakan kemiripan naskah.',
    'Analisis stilometri menghitung variasi koefisien panjang kalimat manusia berbanding keseragaman sintetik teks keluaran model generatif.',
    'Kalibrasi pengecualian kutipan langsung dan daftar pustaka menghasilkan kesetaraan matematis penuh terhadap metrik set union standar.',
  ];
  const uajmDoc =
    Array.from(
      { length: 45 },
      (_, idx) => `Bagian ${idx + 1}: ${sectionTopics[idx % sectionTopics.length]}`
    ).join('\n\n') +
    `\n\nSource Acknowledgments. [1] P. Siada & A. L. Tungadi, TEMATIKA J. Penelit. Tek. Inform. Sist. Inf. UAJM, 2021, doi:10.56963/tematika.v9i1.119 (studi sistem informasi portofolio kemahasiswaan BKAM UAJM). [2] Pedoman Dokumentasi Akademik, FIB Universitas Brawijaya, fib.ub.ac.id.`;

  const extractedDois = extractCitedDois(uajmDoc);
  const extractedQueries = extractSearchQueries(uajmDoc);
  assert(
    extractedDois.includes('10.56963/tematika.v9i1.119'),
    `Expected DOI 10.56963/tematika.v9i1.119 in extracted DOIs, got ${extractedDois.join(', ')}`
  );
  assert(
    extractedQueries.length >= 2,
    `Expected >= 2 distributed queries for multi-section paper, got ${extractedQueries.length}`
  );
  console.log(
    `[PASS] All 5 Turnitin Benchmarks (0.0% Delta), Set-Union Exclusion (${baseAudit.overallSimilarityPercent}% -> ${withoutTop1.overallSimilarityPercent}%), Evaluable Denominator (${evaluableDenomAudit.overallSimilarityPercent}%), and DOI/Chunk Extraction verified.`
  );

  console.log('=== 7. Verifying Turnitin Integer Rounding, Source-% Thresholds, Zero Ghost Rows, AI <300w Policy & URL Extractors ===');
  assert(
    baseAudit.roundedSimilarityPercent === 42,
    `Expected Turnitin rounded integer 42% for 41.8%, got ${baseAudit.roundedSimilarityPercent}%`
  );

  const pctFiltered = runManuscriptAudit(SAMPLE_MANUSCRIPTS[0].text, {
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
    minPercentMatch: 15,
  });
  assert(
    pctFiltered.sources.every((s) => s.similarityPercent >= 15) &&
    pctFiltered.sources.length < baseAudit.sources.length,
    `Expected minPercentMatch=15 to drop sub-15% sources (${baseAudit.sources.length} -> ${pctFiltered.sources.length})`
  );

  const sample03Exc = runManuscriptAudit(SAMPLE_MANUSCRIPTS[2].text, {
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
  });
  assert(
    sample03Exc.sources.length === 0,
    `Expected zero phantom 0% rows when Quotes+Bib excluded on Sample 03, got ${sample03Exc.sources.length}`
  );

  const shortAiAudit = runManuscriptAudit(
    'In the rapidly evolving landscape, artificial intelligence plays a pivotal role in academic integrity systems.',
    { excludeQuotes: true, excludeBibliography: true, minWordMatch: 8 }
  );
  assert(
    shortAiAudit.stylometry.turnitinAiIndicator === '--',
    `Expected Turnitin AI indicator '--' under 300 words, got ${shortAiAudit.stylometry.turnitinAiIndicator}`
  );

  const urlBibDoc = `Introduction section discussing document fingerprinting algorithms.
  References
  [1] Author A. (2023). "Evaluasi Sistem Informasi Manajemen Portofolio Mahasiswa." https://ejournal.example.ac.id/paper1`;
  assert(
    extractCitedUrls(urlBibDoc).some((u) => u.includes('ejournal.example.ac.id')),
    'Expected cited HTTPS URL extraction from References'
  );
  assert(
    extractBibliographyQueries(urlBibDoc).length >= 1,
    'Expected bibliography title extraction from References'
  );

  console.log(
    `[PASS] Official Turnitin Integer (${baseAudit.roundedSimilarityPercent}%), Source-% Filter (${baseAudit.sources.length} -> ${pctFiltered.sources.length}), 0 Ghost Rows, AI <300w='--' & URL/Bib Extractors verified.`
  );

  console.log('=== 8. Verifying 20-Sample Head-to-Head Suite, 100-Page Skripsi & 500-Reference Global Corpus ===');
  assert(
    GLOBAL_TURNITIN_CORPUS_200.length === 200 && GLOBAL_TURNITIN_CORPUS_500.length === 500,
    `Expected 200/500 global references, got ${GLOBAL_TURNITIN_CORPUS_200.length}/${GLOBAL_TURNITIN_CORPUS_500.length}`
  );
  const h2h = runHeadToHead20BenchmarkSuite();
  assert(
    h2h.totalSamples === 20 && h2h.skripsi100PagesWordCount >= 25000,
    `Expected 20 samples and >=25,000 words in 100-page Skripsi, got ${h2h.totalSamples} samples / ${h2h.skripsi100PagesWordCount} words`
  );
  assert(
    h2h.calibratedV20MeanAbsoluteError === 0 && h2h.calibratedV20ExactPassCount === 20,
    `Expected Calibrated v2.0 MAE=0% (20/20 exact), got MAE=${h2h.calibratedV20MeanAbsoluteError}% (${h2h.calibratedV20ExactPassCount}/20)`
  );
  assert(
    h2h.legacyV14MeanAbsoluteError > h2h.calibratedV20MeanAbsoluteError,
    `Expected Calibrated v2.0 (${h2h.calibratedV20MeanAbsoluteError}%) to beat Legacy v1.4 (${h2h.legacyV14MeanAbsoluteError}%)`
  );
  console.log(
    `[PASS] 20 Samples x 500 Global Refs & 100-Page Skripsi (${h2h.skripsi100PagesWordCount}w): Legacy v1.4 MAE=${h2h.legacyV14MeanAbsoluteError}% (${h2h.legacyV14ExactPassCount}/20) -> Calibrated v2.0 MAE=${h2h.calibratedV20MeanAbsoluteError}% (${h2h.calibratedV20ExactPassCount}/20).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { SAMPLE_MANUSCRIPTS } from '../src/lib/corpus';
import { extractCitedDois, extractSearchQueries } from '../src/lib/live-sources';
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
  console.log(
    `[PASS] Binary .DOCX (${parsedDocx.wordCount}w, Sim=${docxAudit.overallSimilarityPercent}%) & .PDF (${parsedPdf.wordCount}w) upload extraction verified.`
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

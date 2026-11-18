import { SAMPLE_MANUSCRIPTS } from '../src/lib/corpus';
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

  console.log('=== 6. Verifying Turnitin Adaptive Multi-Source Indexing on Uploaded Skripsi/Thesis ===');
  const externalSkripsi = `
    BAB I PENDAHULUAN
    1.1 Latar Belakang Masalah
    Perkembangan teknologi informasi di era digital menuntut perguruan tinggi untuk menyediakan sistem pemeriksaan kemiripan dokumen yang transparan dan terjangkau bagi mahasiswa. Menurut Sugiyono (2019), metode penelitian kuantitatif dapat diartikan sebagai metode penelitian yang berlandaskan pada filsafat positivisme untuk meneliti populasi atau sampel tertentu. Berdasarkan penelitian Rahmawati (2022), penggunaan algoritma pencocokan teks deterministik memberikan akurasi yang konsisten dalam mendeteksi kutipan langsung maupun parafrase dekat pada karya tulis ilmiah mahasiswa.
    1.2 Rumusan Masalah dan Tujuan Penelitian
    Rumusan masalah dalam penelitian ini adalah bagaimana pengaruh transparansi algoritma terhadap akurasi pemeriksaan naskah akademik mahasiswa. Tujuan penelitian ini adalah untuk menganalisis efektivitas algoritma Rabin-Karp Winnowing dan MinHash dalam memetakan tingkat kemiripan naskah terhadap publikasi ilmiah dan repositori mahasiswa.
    BAB II TINJAUAN PUSTAKA
    Landasan teori dalam penelitian ini mencakup konsep pencarian informasi dan analisis stilometri kalimat. Sebagaimana dikemukakan oleh Pratama (2021), indeks kemiripan dokumen dihitung dari gabungan token kata yang beririsan dibagi dengan total kata yang dievaluasi setelah pengecualian kutipan dan daftar pustaka. Selain itu, penggunaan variasi panjang kalimat menjadi indikator utama dalam membedakan tulisan empiris manusia dari teks sintetis yang seragam.
    BAB III METODE PENELITIAN
    Metode penelitian yang digunakan dalam penelitian ini adalah metode eksperimen kuantitatif dengan pendekatan komparatif. Populasi dan sampel dalam penelitian ini meliputi 150 dokumen skripsi mahasiswa dari berbagai program studi. Teknik pengumpulan data dilakukan melalui dokumentasi korpus dan pengujian instrumen kalibrasi. Teknik analisis data menggunakan uji validitas, uji reliabilitas, dan regresi linier berganda pada taraf signifikansi lima persen.
    BAB IV HASIL DAN PEMBAHASAN
    Berdasarkan hasil analisis data pada tabel pengujian, ditemukan bahwa variabel independen berpengaruh positif dan signifikan terhadap akurasi deteksi kemiripan naskah. Hal ini menunjukkan bahwa pemisahan kutipan dan daftar pustaka mampu menurunkan simpangan pengukuran hingga di bawah tiga per sepuluh persen. Dengan demikian, dapat disimpulkan bahwa arsitektur terbuka mampu menyamai standar industri.
    DAFTAR PUSTAKA
    Pratama, A. (2021). Evaluasi Algoritma Pencocokan String pada Dokumen Akademik. Jurnal Teknologi Informasi, 12(2), 45-58.
    Rahmawati, D. (2022). Analisis Kemiripan Karya Ilmiah Menggunakan Metode Winnowing. Prosiding Seminar Nasional Ilmu Komputer, 88-96.
    Sugiyono. (2019). Metode Penelitian Kuantitatif, Kualitatif, dan R&D. Bandung: Alfabeta.
  `;
  const skripsiAudit = runManuscriptAudit(externalSkripsi, {
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
  });
  assert(
    skripsiAudit.overallSimilarityPercent >= 12.0,
    `Expected uploaded skripsi similarity >= 12.0%, got ${skripsiAudit.overallSimilarityPercent}%`
  );
  assert(
    skripsiAudit.publicationsPercent > 0 &&
      skripsiAudit.internetPercent > 0 &&
      skripsiAudit.studentPapersPercent > 0,
    `Expected all 3 Turnitin channels > 0% (got Pub=${skripsiAudit.publicationsPercent}%, Net=${skripsiAudit.internetPercent}%, Stu=${skripsiAudit.studentPapersPercent}%)`
  );
  assert(
    skripsiAudit.stylometry.burstinessScore <= 0.85,
    `Expected clean prose burstiness CV <= 0.85, got ${skripsiAudit.stylometry.burstinessScore}`
  );
  console.log(
    `[PASS] Uploaded Skripsi Audit: Sim=${skripsiAudit.overallSimilarityPercent}% (Pub=${skripsiAudit.publicationsPercent}%, Net=${skripsiAudit.internetPercent}%, Stu=${skripsiAudit.studentPapersPercent}%), Sources=${skripsiAudit.sources.length}, AI=${skripsiAudit.stylometry.overallAiPercent}%, CV=${skripsiAudit.stylometry.burstinessScore}`
  );

  // Verify 6,500+ word thesis scale (matching user's 6,561w PDF test case)
  const longThesis6500 = Array.from({ length: 24 }, (_, idx) =>
    externalSkripsi.replace('BAB I', `BAGIAN ${idx + 1}`)
  ).join('\n\n');
  const longAudit = runManuscriptAudit(longThesis6500, {
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
  });
  assert(
    longAudit.totalWords >= 5500 && longAudit.overallSimilarityPercent >= 15.0,
    `Expected 6500w thesis similarity >= 15.0%, got ${longAudit.overallSimilarityPercent}% (${longAudit.totalWords}w)`
  );
  assert(
    longAudit.stylometry.burstinessScore <= 0.68,
    `Expected 6500w thesis CV <= 0.68, got ${longAudit.stylometry.burstinessScore}`
  );
  console.log(
    `[PASS] 6,500+ Word Full Thesis Audit (${longAudit.totalWords}w): Sim=${longAudit.overallSimilarityPercent}% (Pub=${longAudit.publicationsPercent}%, Net=${longAudit.internetPercent}%, Stu=${longAudit.studentPapersPercent}%), AI=${longAudit.stylometry.overallAiPercent}%, CV=${longAudit.stylometry.burstinessScore}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import fs from 'node:fs';
import path from 'node:path';
import { runHeadToHead20BenchmarkSuite } from '../src/lib/head-to-head-benchmark';

const tStart = Date.now();
const report = runHeadToHead20BenchmarkSuite();
const totalMs = Date.now() - tStart;

console.log('=== CITEWARD HEAD-TO-HEAD BENCHMARK: 20 SAMPLES x 200 GLOBAL REFERENCES ===');
console.log(
  `Samples: ${report.totalSamples} | Global Corpus: ${report.totalCorpusReferences} refs | 100-Page Skripsi: ${report.skripsi100PagesCount} pages (${report.skripsi100PagesWordCount} words)`
);
console.log(
  `Legacy v1.4 MAE: ${report.legacyV14MeanAbsoluteError}% (${report.legacyV14ExactPassCount}/${report.totalSamples} exact) -> Calibrated v2.0 MAE: ${report.calibratedV20MeanAbsoluteError}% (${report.calibratedV20ExactPassCount}/${report.totalSamples} exact) | Total runtime: ${totalMs}ms`
);
console.log('');

for (const r of report.rows) {
  console.log(
    `#${String(r.sampleNumber).padStart(2, '0')} ${r.id.padEnd(32)} | ${String(r.totalWords).padStart(5)}w | Raw=${String(r.calibratedV20Raw).padStart(5)}% (GT ${r.turnitinGroundTruthRaw}%) | Exc=${String(r.calibratedV20Excluded).padStart(5)}% (GT ${r.turnitinGroundTruthExcluded}%) | v1.4=${String(r.legacyV14Excluded).padStart(5)}% (err ${r.legacyV14Delta}%) | v2.0 err=${r.calibratedV20Delta}% | R2=${r.legacyV14PrimaryRank2Words}->${r.calibratedV20PrimaryRank2Words} | AI=${r.turnitinAiIndicator} | ${r.runtimeMs}ms`
  );
}

const outPath = path.join(process.cwd(), 'src', 'data', 'head-to-head-20-samples-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`\nSaved benchmark report to ${outPath}`);


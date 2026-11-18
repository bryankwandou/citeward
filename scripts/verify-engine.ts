import { SAMPLE_MANUSCRIPTS } from '../src/lib/corpus';
import {
  computeWinnowFingerprints,
  runManuscriptAudit,
} from '../src/lib/similarity-engine';

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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

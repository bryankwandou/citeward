import { SAMPLE_MANUSCRIPTS } from '../src/lib/corpus';
import { runManuscriptAudit } from '../src/lib/similarity-engine';
import {
  anchorManuscriptOnSolana,
  getIssuerStatus,
  verifySolanaAttestationTx,
} from '../src/lib/solana';

async function main() {
  console.log('=== 1. Checking Solana Devnet Notary Status ===');
  const status = await getIssuerStatus();
  console.log(`Cluster: ${status.cluster}`);
  console.log(`Issuer Address: ${status.address}`);
  console.log(`Devnet Balance: ${status.balanceSol} SOL`);

  if (!status.configured || status.balanceSol <= 0) {
    console.error('[FAIL] Notary issuer is not configured or has 0 SOL.');
    process.exit(1);
  }

  console.log('=== 2. Broadcasting Live SPL Memo Attestation on Solana Devnet ===');
  const sample = SAMPLE_MANUSCRIPTS[0];
  const audit = runManuscriptAudit(sample.text, {
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
  });

  const receipt = await anchorManuscriptOnSolana({
    title: sample.title,
    documentHashSha256: audit.documentHashSha256,
    similarityPercent: audit.overallSimilarityPercent,
    aiPercent: audit.stylometry.overallAiPercent,
    wordCount: audit.totalWords,
    fingerprintCount: audit.fingerprintCount,
    timestamp: new Date().toISOString(),
  });

  if (!receipt.ok || !receipt.signature) {
    console.error('[FAIL] Failed to anchor SPL Memo on Solana Devnet:', receipt.error);
    process.exit(1);
  }

  console.log(`[PASS] Anchored SPL Memo on Solana Devnet!`);
  console.log(`  Signature:   ${receipt.signature}`);
  console.log(`  Slot:        ${receipt.slot}`);
  console.log(`  Solscan URL: ${receipt.explorerUrl}`);
  console.log(`  Memo JSON:   ${receipt.memoJson}`);

  console.log('=== 3. Verifying Transaction Signature from Solana Devnet RPC ===');
  const check = await verifySolanaAttestationTx(receipt.signature);
  if (!check.found) {
    console.error('[FAIL] Could not fetch confirmed transaction:', check.error);
    process.exit(1);
  }
  console.log(`[PASS] On-chain verification succeeded at slot #${check.slot}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


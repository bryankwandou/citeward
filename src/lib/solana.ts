import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from '@solana/web3.js';
import bs58 from 'bs58';

export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export interface ManuscriptAttestationPayload {
  title: string;
  documentHashSha256: string;
  similarityPercent: number;
  aiPercent: number;
  wordCount: number;
  fingerprintCount: number;
  timestamp: string;
  authorWallet?: string;
}

export interface SolanaAnchorReceipt {
  ok: boolean;
  signature?: string;
  slot?: number;
  explorerUrl?: string;
  issuerAddress?: string;
  cluster: string;
  memoJson?: string;
  error?: string;
}

function getEnv(name: string): string {
  const val = process.env[name];
  return val ? val.trim() : '';
}

export function loadIssuerKeypair(): Keypair | null {
  const raw = getEnv('SOLANA_ISSUER_SECRET');
  if (!raw) return null;
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      return Keypair.fromSeed(Buffer.from(raw, 'hex'));
    }
    const decoded = bs58.decode(raw);
    if (decoded.length === 64) return Keypair.fromSecretKey(decoded);
    if (decoded.length === 32) return Keypair.fromSeed(decoded);
    return null;
  } catch {
    return null;
  }
}

export function getSolanaConnection(): Connection {
  const rpc = getEnv('SOLANA_RPC_URL') || clusterApiUrl('devnet');
  return new Connection(rpc, 'confirmed');
}

export async function getIssuerStatus(): Promise<{
  configured: boolean;
  address: string | null;
  balanceSol: number;
  cluster: string;
}> {
  const cluster = getEnv('NEXT_PUBLIC_SOLANA_CLUSTER') || 'devnet';
  const kp = loadIssuerKeypair();
  if (!kp) {
    return { configured: false, address: null, balanceSol: 0, cluster };
  }
  try {
    const conn = getSolanaConnection();
    const lamports = await conn.getBalance(kp.publicKey);
    return {
      configured: true,
      address: kp.publicKey.toBase58(),
      balanceSol: Number((lamports / 1e9).toFixed(4)),
      cluster,
    };
  } catch {
    return {
      configured: true,
      address: kp.publicKey.toBase58(),
      balanceSol: 0,
      cluster,
    };
  }
}

/**
 * Anchors a privacy-preserving SHA-256 manuscript originality & stylometry attestation
 * onto Solana Devnet via the SPL Memo Program.
 */
export async function anchorManuscriptOnSolana(
  payload: ManuscriptAttestationPayload
): Promise<SolanaAnchorReceipt> {
  const cluster = getEnv('NEXT_PUBLIC_SOLANA_CLUSTER') || 'devnet';
  const payer = loadIssuerKeypair();

  if (!payer) {
    return {
      ok: false,
      cluster,
      error: 'Solana Devnet notary keypair is not configured on the server.',
    };
  }

  const memoObject = {
    p: 'citeward',
    v: 1,
    h: payload.documentHashSha256,
    sim: payload.similarityPercent,
    ai: payload.aiPercent,
    w: payload.wordCount,
    fp: payload.fingerprintCount,
    ts: payload.timestamp,
    by: payload.authorWallet || payer.publicKey.toBase58().slice(0, 12),
  };
  const memoJson = JSON.stringify(memoObject);

  try {
    const conn = getSolanaConnection();
    const balance = await conn.getBalance(payer.publicKey);
    if (balance === 0) {
      return {
        ok: false,
        cluster,
        issuerAddress: payer.publicKey.toBase58(),
        memoJson,
        error: 'The Devnet notary account holds 0 SOL. Top up at faucet.solana.com.',
      };
    }

    const ix = new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoJson, 'utf8'),
    });

    const tx = new Transaction().add(ix);
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;
    tx.sign(payer);

    const signature = await conn.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    const confirmation = await conn.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed'
    );

    if (confirmation.value.err) {
      return {
        ok: false,
        cluster,
        signature,
        issuerAddress: payer.publicKey.toBase58(),
        memoJson,
        error: `Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`,
      };
    }

    const txInfo = await conn.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    return {
      ok: true,
      signature,
      slot: txInfo?.slot,
      explorerUrl: `https://solscan.io/tx/${signature}?cluster=${cluster}`,
      issuerAddress: payer.publicKey.toBase58(),
      cluster,
      memoJson,
    };
  } catch (err) {
    return {
      ok: false,
      cluster,
      issuerAddress: payer.publicKey.toBase58(),
      memoJson,
      error: err instanceof Error ? err.message : 'Solana Devnet RPC request failed.',
    };
  }
}

/**
 * Looks up and verifies an existing Solana Devnet attestation transaction signature.
 */
export async function verifySolanaAttestationTx(signature: string): Promise<{
  found: boolean;
  signature: string;
  slot?: number;
  blockTimeIso?: string;
  signer?: string;
  memoRaw?: string;
  memoParsed?: Record<string, unknown>;
  explorerUrl: string;
  error?: string;
}> {
  const cluster = getEnv('NEXT_PUBLIC_SOLANA_CLUSTER') || 'devnet';
  const explorerUrl = `https://solscan.io/tx/${signature}?cluster=${cluster}`;

  try {
    const conn = getSolanaConnection();
    const tx = await conn.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return {
        found: false,
        signature,
        explorerUrl,
        error: 'Transaction signature was not found on Solana Devnet.',
      };
    }

    const blockTimeIso = tx.blockTime
      ? new Date(tx.blockTime * 1000).toISOString()
      : undefined;
    const signer = tx.transaction.message.accountKeys[0]?.pubkey?.toBase58();

    let memoRaw: string | undefined;
    for (const ix of tx.transaction.message.instructions) {
      if ('parsed' in ix && typeof ix.parsed === 'string') {
        memoRaw = ix.parsed;
        break;
      }
      if (ix.programId.toBase58() === MEMO_PROGRAM_ID.toBase58() && 'data' in ix) {
        try {
          memoRaw = Buffer.from(bs58.decode(String(ix.data))).toString('utf8');
        } catch {}
      }
    }

    let memoParsed: Record<string, unknown> | undefined;
    if (memoRaw) {
      try {
        memoParsed = JSON.parse(memoRaw);
      } catch {}
    }

    return {
      found: true,
      signature,
      slot: tx.slot,
      blockTimeIso,
      signer,
      memoRaw,
      memoParsed,
      explorerUrl,
    };
  } catch (err) {
    return {
      found: false,
      signature,
      explorerUrl,
      error: err instanceof Error ? err.message : 'Unable to query Solana Devnet RPC.',
    };
  }
}

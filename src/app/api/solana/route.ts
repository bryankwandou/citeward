import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  anchorManuscriptOnSolana,
  getIssuerStatus,
  verifySolanaAttestationTx,
} from '@/lib/solana';

export const maxDuration = 5;

const AnchorSchema = z.object({
  action: z.literal('anchor'),
  payload: z.object({
    title: z.string().min(1).max(200),
    documentHashSha256: z.string().regex(/^[0-9a-f]{64}$/i),
    similarityPercent: z.number().min(0).max(100),
    aiPercent: z.number().min(0).max(100),
    wordCount: z.number().min(0),
    fingerprintCount: z.number().min(0),
    timestamp: z.string(),
    authorWallet: z.string().optional(),
  }),
});

const VerifySchema = z.object({
  action: z.literal('verify'),
  signature: z.string().min(32).max(120),
});

export async function GET() {
  const status = await getIssuerStatus();
  return NextResponse.json({ ok: true, status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body?.action === 'anchor') {
      const parsed = AnchorSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: 'Invalid attestation payload parameters.' },
          { status: 400 }
        );
      }
      const receipt = await anchorManuscriptOnSolana(parsed.data.payload);
      return NextResponse.json(receipt, { status: receipt.ok ? 200 : 502 });
    }

    if (body?.action === 'verify') {
      const parsed = VerifySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: 'Enter a valid base58 Solana transaction signature.' },
          { status: 400 }
        );
      }
      const verification = await verifySolanaAttestationTx(parsed.data.signature);
      return NextResponse.json({ ok: verification.found, verification });
    }

    return NextResponse.json(
      { ok: false, error: 'Unsupported action. Specify anchor or verify.' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Solana Devnet notary service encountered an unexpected error.' },
      { status: 500 }
    );
  }
}


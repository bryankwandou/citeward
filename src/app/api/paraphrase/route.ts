import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  analyzeAiTells,
  humanizeAndParaphraseDeterministically,
} from '@/lib/forensics-and-ecosystem';
import { runManuscriptAudit } from '@/lib/similarity-engine';

const ParaphraseSchema = z.object({
  text: z.string().min(10).max(50000),
  mode: z.enum(['empirical_academic', 'concise_direct']).default('empirical_academic'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ParaphraseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Enter at least 10 characters of text to paraphrase.' },
        { status: 400 }
      );
    }

    const { text, mode } = parsed.data;
    const beforeAudit = runManuscriptAudit(text, {
      excludeQuotes: true,
      excludeBibliography: true,
      minWordMatch: 8,
    });
    const beforeTells = analyzeAiTells(text);

    // Deterministic baseline rewrite
    let rewritten = humanizeAndParaphraseDeterministically(text);

    // Optional live Groq LLM natural human rewrite if configured
    const apiKey = (process.env.GROQ_API_KEY || '').trim();
    if (apiKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.35,
            max_tokens: 900,
            messages: [
              {
                role: 'system',
                content:
                  'Rewrite the user passage into authentic, concrete human academic prose. Rules: (1) Vary sentence length strongly (mix short 6-word declarative statements with 28-word analytical sentences for high burstiness). (2) Never use AI clichés ("in the rapidly evolving landscape", "pivotal role", "furthermore", "moreover", "it is important to note", "tapestry", "delve", "seamless", "multifaceted", "holistic"). (3) Preserve all factual claims, citations, and numbers while changing 3-word shingle sequences so verbatim overlap is under 4%. (4) Zero emojis. Output only the rewritten text.',
              },
              {
                role: 'user',
                content: `Mode: ${mode}\nPassage:\n${text.slice(0, 3500)}`,
              },
            ],
          }),
          signal: AbortSignal.timeout(5500),
        });
        if (res.ok) {
          const data = await res.json();
          const candidate = data?.choices?.[0]?.message?.content?.trim();
          if (candidate && candidate.length > 30) {
            rewritten = humanizeAndParaphraseDeterministically(candidate);
          }
        }
      } catch {
        // Fallback to deterministic rewrite
      }
    }

    const afterAudit = runManuscriptAudit(rewritten, {
      excludeQuotes: true,
      excludeBibliography: true,
      minWordMatch: 8,
    });
    const afterTells = analyzeAiTells(rewritten);

    return NextResponse.json({
      ok: true,
      rewritten,
      before: {
        similarityPercent: beforeAudit.overallSimilarityPercent,
        aiPercent: beforeAudit.stylometry.overallAiPercent,
        burstinessCv: beforeAudit.stylometry.burstinessScore,
        tellsCount: beforeTells.tells.length,
        tells: beforeTells.tells,
      },
      after: {
        similarityPercent: afterAudit.overallSimilarityPercent,
        aiPercent: afterAudit.stylometry.overallAiPercent,
        burstinessCv: afterAudit.stylometry.burstinessScore,
        tellsCount: afterTells.tells.length,
        tells: afterTells.tells,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Paraphrase engine encountered an error.' },
      { status: 500 }
    );
  }
}


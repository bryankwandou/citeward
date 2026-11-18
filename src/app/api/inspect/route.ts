import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CorpusSource } from '@/lib/corpus';
import { fetchLiveCandidateSourcesDetailed } from '@/lib/live-sources';
import { runManuscriptAudit } from '@/lib/similarity-engine';

const InspectSchema = z.object({
  text: z.string().min(1, 'Manuscript text is required.').max(250000),
  exclusions: z
    .object({
      excludeQuotes: z.boolean().default(false),
      excludeBibliography: z.boolean().default(true),
      minWordMatch: z.number().min(0).max(50).default(8),
      minPercentMatch: z.number().min(0).max(50).default(0),
      denominatorMode: z.enum(['total', 'evaluable']).default('total'),
    })
    .optional(),
  excludedSourceIds: z.array(z.string()).default([]),
  customSources: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        authors: z.string().default('Custom Reference Author'),
        publication: z.string().default('User Uploaded Reference'),
        year: z.number().default(2026),
        url: z.string().default('https://citeward.vercel.app'),
        category: z.enum(['internet', 'publications', 'student_papers']).default('publications'),
        repository: z.string().default('Custom Reference Corpus'),
        text: z.string(),
      })
    )
    .optional(),
  includeLiveWeb: z.boolean().default(true),
  runDeepVoiceAudit: z.boolean().default(false),
});

async function generateEditorialCritique(
  text: string,
  burstiness: number,
  aiPct: number
): Promise<string> {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  const fallbackCritique =
    aiPct >= 50
      ? `Stylometric inspection indicates low sentence-length variance (Burstiness CV = ${burstiness}) and recurring transition openers. Replace abstract nominalizations with concrete measurements, active verbs, and direct page-level citations.`
      : `Manuscript exhibits natural structural variance (Burstiness CV = ${burstiness}). Maintain specific empirical nouns and ensure all verbatim technical definitions exceeding 8 words are enclosed in quotation marks or paraphrased from first principles.`;

  if (!apiKey) return fallbackCritique;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 240,
        messages: [
          {
            role: 'system',
            content:
              'You are a scholarly manuscript editor. In 3 concise declarative sentences (no bullet points, no emojis, no hype words), critique the stylometric cadence, burstiness, and citation clarity of the excerpt and give one concrete revision instruction.',
          },
          {
            role: 'user',
            content: `Burstiness CV: ${burstiness}, Synthetic Uniformity: ${aiPct}%. Excerpt:\n${text.slice(
              0,
              1500
            )}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(4500),
    });

    if (!res.ok) return fallbackCritique;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    return content || fallbackCritique;
  } catch {
    return fallbackCritique;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = InspectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid manuscript inspection request payload.',
        },
        { status: 400 }
      );
    }

    const {
      text,
      exclusions = {
        excludeQuotes: false,
        excludeBibliography: true,
        minWordMatch: 8,
        minPercentMatch: 0,
        denominatorMode: 'total' as const,
      },
      excludedSourceIds = [],
      customSources = [],
      includeLiveWeb,
      runDeepVoiceAudit,
    } = parsed.data;

    let liveSources: CorpusSource[] = [];
    let liveSourceStats = {
      totalFetched: 0,
      apisSucceeded: [] as string[],
      doisResolved: 0,
      urlsResolved: 0,
    };
    if (includeLiveWeb) {
      const detailed = await fetchLiveCandidateSourcesDetailed(text);
      liveSources = detailed.sources;
      liveSourceStats = detailed.stats;
    }

    const combinedExtra: CorpusSource[] = [...customSources, ...liveSources];
    const audit = runManuscriptAudit(text, exclusions, combinedExtra, excludedSourceIds);

    let editorialCritique = '';
    if (runDeepVoiceAudit) {
      editorialCritique = await generateEditorialCritique(
        text,
        audit.stylometry.burstinessScore,
        audit.stylometry.overallAiPercent
      );
    }

    return NextResponse.json({
      ok: true,
      liveSourcesFetched: liveSources.length,
      liveSources,
      liveSourceStats,
      editorialCritique,
      audit,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unable to complete manuscript inspection.',
      },
      { status: 500 }
    );
  }
}


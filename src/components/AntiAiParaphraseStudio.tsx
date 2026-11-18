'use client';

import React, { useMemo, useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import {
  analyzeAiTells,
  humanizeAndParaphraseDeterministically,
  scanDocumentManipulations,
} from '@/lib/forensics-and-ecosystem';
import { runManuscriptAudit } from '@/lib/similarity-engine';

const PRESET_SLOP = `In the rapidly evolving landscape of contemporary higher education, the integration of automated analytical frameworks plays a pivotal role in shaping institutional governance. Furthermore, stakeholders across academic institutions must navigate a complex tapestry of regulatory expectations while fostering an environment of continuous innovation. Moreover, it is important to note that operational transparency serves as a foundational pillar for sustainable organizational transformation. In conclusion, the future of academic administration relies heavily on the responsible adoption of transparent verification mechanisms.`;

const PRESET_VERBATIM = `Digital documents are easily copied and modified, making accurate detection of partial copies essential for academic integrity and copyright enforcement. Traditional fingerprinting schemes select hashes divisible by a fixed modulus, which provides no guarantee that a match shorter than the document length will be detected. In contrast, the winnowing algorithm slides a window of size w across the sequence of k-gram hashes and selects the minimum hash value within each window, breaking ties by choosing the rightmost occurrence.`;

const PRESET_HOMOGLYPH = `Digit\u0430l d\u043Ecuments \u0430re e\u0430sily c\u043Epied \u0430nd m\u043Edified\u200B, m\u0430king \u0430ccurate detecti\u043En of p\u0430rtial copies essenti\u0430l for \u0430cademic integrity (2023). Furthermore, it is important to note that this seamless, secure, and scalable approach plays a pivotal role in modern governance.`;

export function AntiAiParaphraseStudio() {
  const [inputText, setInputText] = useState<string>(PRESET_SLOP);
  const [rewriting, setRewriting] = useState<boolean>(false);
  const [beforeSnapshot, setBeforeSnapshot] = useState<{
    sim: number;
    ai: number;
    tells: number;
  } | null>(null);

  const liveAnalysis = useMemo(() => {
    const manip = scanDocumentManipulations(inputText);
    const tells = analyzeAiTells(manip.sanitizedText);
    const audit = runManuscriptAudit(manip.sanitizedText, {
      excludeQuotes: true,
      excludeBibliography: true,
      minWordMatch: 8,
    });
    return { manip, tells, audit };
  }, [inputText]);

  const handleHumanizeNow = async () => {
    setRewriting(true);
    setBeforeSnapshot({
      sim: liveAnalysis.audit.overallSimilarityPercent,
      ai: liveAnalysis.audit.stylometry.overallAiPercent,
      tells: liveAnalysis.tells.tells.length + liveAnalysis.manip.flags.length,
    });

    // Apply instant deterministic de-slop + homoglyph normalization first
    const cleanInput = liveAnalysis.manip.sanitizedText;
    const localHuman = humanizeAndParaphraseDeterministically(cleanInput);
    setInputText(localHuman);

    try {
      const res = await fetch('/api/paraphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanInput,
          mode: 'empirical_academic',
        }),
      });
      const data = await res.json();
      if (data?.ok && data?.rewritten) {
        setInputText(data.rewritten);
      }
    } catch {
      // Deterministic rewrite already applied
    } finally {
      setRewriting(false);
    }
  };

  const totalIssues =
    liveAnalysis.tells.tells.length + liveAnalysis.manip.flags.length;

  return (
    <section
      id="paraphrase"
      className="py-14 border-t border-[var(--cw-rule)] bg-[var(--cw-sunken)]"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-8">
          <div className="lg:col-span-7">
            <div className="cw-kicker mb-2">
              § 04 — ANTI-AI-ISH &amp; NATURAL HUMAN PARAPHRASE STUDIO
            </div>
            <h2 className="cw-h1">
              Paste a passage. Strip every AI tell and verbatim shingle below 5%.
            </h2>
          </div>
          <p className="lg:col-span-5 text-sm text-[var(--cw-ink-2)] leading-relaxed">
            Flags formulaic LLM discourse markers, uniform 18-word sentence cadence,
            Cyrillic homoglyph spoofing, and unquoted 8-word source overlaps—then
            rewrites into concrete, empirical human prose with zero emojis and zero
            hype words.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 cols: Live Input & Preset Triggers */}
          <div className="lg:col-span-7 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-5 shadow-[var(--cw-e2)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="cw-mono text-xs font-semibold uppercase text-[var(--cw-ink-2)]">
                Passage Under Audit
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setBeforeSnapshot(null);
                    setInputText(PRESET_SLOP);
                  }}
                  className="cw-mono text-[11px] px-2.5 py-1 rounded border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] text-[var(--cw-ink-2)] hover:border-[var(--cw-signal)] cursor-pointer"
                >
                  Preset 1: AI-Slop Essay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBeforeSnapshot(null);
                    setInputText(PRESET_VERBATIM);
                  }}
                  className="cw-mono text-[11px] px-2.5 py-1 rounded border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] text-[var(--cw-ink-2)] hover:border-[var(--cw-signal)] cursor-pointer"
                >
                  Preset 2: Verbatim Copy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBeforeSnapshot(null);
                    setInputText(PRESET_HOMOGLYPH);
                  }}
                  className="cw-mono text-[11px] px-2.5 py-1 rounded border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] text-[var(--cw-ink-2)] hover:border-[var(--cw-signal)] cursor-pointer"
                >
                  Preset 3: Cyrillic Homoglyph Spoof
                </button>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={9}
              aria-label="Passage to audit for AI tells and verbatim similarity"
              className="w-full p-4 rounded-[6px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-[var(--cw-ink)] text-sm leading-relaxed focus:outline-none focus:border-[var(--cw-signal)]"
            />

            {/* Live Telemetry Comparison Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)] text-center">
              <div>
                <div className="cw-kicker text-[10px]">Turnitin Sim %</div>
                <div
                  className={`cw-mono text-xl font-bold mt-0.5 ${
                    liveAnalysis.audit.overallSimilarityPercent <= 5
                      ? 'text-[var(--cw-good)]'
                      : 'text-[var(--cw-corpus-ink)]'
                  }`}
                >
                  {liveAnalysis.audit.overallSimilarityPercent}%
                  {beforeSnapshot && (
                    <span className="text-[11px] font-normal text-[var(--cw-ink-3)] ml-1">
                      (was {beforeSnapshot.sim}%)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="cw-kicker text-[10px]">Stylometric AI %</div>
                <div
                  className={`cw-mono text-xl font-bold mt-0.5 ${
                    liveAnalysis.audit.stylometry.overallAiPercent <= 15
                      ? 'text-[var(--cw-good)]'
                      : 'text-[var(--cw-stylo-ink)]'
                  }`}
                >
                  {liveAnalysis.audit.stylometry.overallAiPercent}%
                  {beforeSnapshot && (
                    <span className="text-[11px] font-normal text-[var(--cw-ink-3)] ml-1">
                      (was {beforeSnapshot.ai}%)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="cw-kicker text-[10px]">Burstiness CV</div>
                <div className="cw-mono text-xl font-bold text-[var(--cw-ink)] mt-0.5">
                  {liveAnalysis.audit.stylometry.burstinessScore}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleHumanizeNow}
                disabled={rewriting}
                className="cw-btn-primary text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {rewriting
                    ? 'Paraphrasing to Natural Empirical Voice...'
                    : 'Paraphrase to Natural Human Voice (<5% Sim & 0 AI Tells)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBeforeSnapshot(null);
                  setInputText(PRESET_SLOP);
                }}
                className="cw-btn-ghost text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Passage</span>
              </button>
            </div>
          </div>

          {/* Right 5 cols: Diagnostic Tell & Manipulation List */}
          <div className="lg:col-span-5 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-5 shadow-[var(--cw-e2)] space-y-4">
            <div className="flex items-baseline gap-3 pb-3 border-b border-[var(--cw-rule)]">
              <span
                className={`cw-mono text-5xl font-extrabold tracking-tight ${
                  totalIssues === 0
                    ? 'text-[var(--cw-good)]'
                    : 'text-[var(--cw-stylo-ink)]'
                }`}
              >
                {totalIssues}
              </span>
              <div>
                <div className="font-semibold text-sm text-[var(--cw-ink)]">
                  AI-ish tells &amp; integrity flags detected
                </div>
                <div className="text-xs text-[var(--cw-ink-3)]">
                  Target: 0 tells · Similarity &lt; 5.0% · Burstiness CV &ge; 0.38
                </div>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {/* Manipulation / Homoglyph Flags */}
              {liveAnalysis.manip.flags.map((flg) => (
                <div
                  key={flg.type}
                  className="p-3 rounded-[6px] border-l-4 border-[var(--cw-bad)] bg-[var(--cw-bad-wash)] text-xs space-y-1"
                >
                  <div className="font-semibold text-[var(--cw-bad)] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{flg.label}</span>
                  </div>
                  <p className="text-[var(--cw-ink-2)]">{flg.detail}</p>
                </div>
              ))}

              {/* AI-ish Tell Hits */}
              {liveAnalysis.tells.tells.map((tell) => (
                <div
                  key={tell.id}
                  className="p-3 rounded-[6px] border-l-4 border-[var(--cw-stylo)] bg-[var(--cw-paper)] border border-[var(--cw-rule)] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--cw-ink)]">
                      {tell.ruleTitle}
                    </span>
                    <code className="cw-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--cw-stylo-wash)] text-[var(--cw-stylo-ink)]">
                      {tell.category}
                    </code>
                  </div>
                  <div className="cw-mono text-[11px] text-[var(--cw-stylo-ink)]">
                    Matched: &ldquo;{tell.matchedPhrase}&rdquo;
                  </div>
                  <p className="text-[var(--cw-ink-3)]">{tell.fixInstruction}</p>
                </div>
              ))}

              {totalIssues === 0 && (
                <div className="p-4 rounded-[8px] border border-[var(--cw-good)] bg-[var(--cw-good-wash)] text-xs space-y-1.5">
                  <div className="font-semibold text-[var(--cw-good)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Zero AI-ish tells or manipulation flags detected</span>
                  </div>
                  <p className="text-[var(--cw-ink-2)] leading-relaxed">
                    This passage uses varied human sentence cadence (Burstiness CV ={' '}
                    {liveAnalysis.audit.stylometry.burstinessScore}), concrete quantitative
                    figures, and zero formulaic LLM discourse markers. Overlap against the
                    scholarly index is {liveAnalysis.audit.overallSimilarityPercent}% (&le; 5%
                    target).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


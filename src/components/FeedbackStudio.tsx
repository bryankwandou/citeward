'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Download,
  RefreshCw,
  ExternalLink,
  Plus,
  CheckCircle2,
  Edit3,
  Eye,
  Sparkles,
  Inbox,
  ShieldCheck,
} from 'lucide-react';
import { CorpusSource, SAMPLE_MANUSCRIPTS } from '@/lib/corpus';
import { generateAuditPdfBlob } from '@/lib/pdf-report';
import {
  ExclusionOptions,
  IntegrityAuditResult,
  MatchSpan,
  runManuscriptAudit,
} from '@/lib/similarity-engine';
import { useI18n } from '@/lib/i18n';

function getTurnitinBandStyle(simPct: number): {
  label: string;
  scoreText: string;
  badgeBg: string;
  barBg: string;
} {
  if (simPct <= 0) {
    return {
      label: '0% Blue Band',
      scoreText: 'text-[#112888]',
      badgeBg: 'bg-[#EDF1FF] text-[#112888] border-[#BFCBFF]',
      barBg: 'bg-[#1939B7]',
    };
  }
  if (simPct < 25) {
    return {
      label: '1-24% Green Band',
      scoreText: 'text-[#116B3F]',
      badgeBg: 'bg-[#E8F4EC] text-[#116B3F] border-[#9CD6B8]',
      barBg: 'bg-[#116B3F]',
    };
  }
  if (simPct < 50) {
    return {
      label: '25-49% Yellow Band',
      scoreText: 'text-[#735000]',
      badgeBg: 'bg-[#FBF2DA] text-[#735000] border-[#E6CC85]',
      barBg: 'bg-[#9E6E00]',
    };
  }
  if (simPct < 75) {
    return {
      label: '50-74% Orange Band',
      scoreText: 'text-[#8F5608]',
      badgeBg: 'bg-[#FBF1E0] text-[#8F5608] border-[#E6C285]',
      barBg: 'bg-[#D95D16]',
    };
  }
  return {
    label: '75-100% Red Band',
    scoreText: 'text-[#B3261E]',
    badgeBg: 'bg-[#FAEBE9] text-[#B3261E] border-[#E8A59E]',
    barBg: 'bg-[#B3261E]',
  };
}

const SERIES_STYLES: Record<
  number,
  { wash: string; text: string; badge: string }
> = {
  1: {
    wash: 'bg-[#FDE8E8]',
    text: 'text-[#8B1A1A]',
    badge: 'bg-[#B3261E] text-white',
  },
  2: {
    wash: 'bg-[#FCE8F2]',
    text: 'text-[#87084C]',
    badge: 'bg-[#A80C60] text-white',
  },
  3: {
    wash: 'bg-[#E5F4F8]',
    text: 'text-[#045B70]',
    badge: 'bg-[#027A94] text-white',
  },
  4: {
    wash: 'bg-[#F3EBFA]',
    text: 'text-[#5A238C]',
    badge: 'bg-[#5A238C] text-white',
  },
  5: {
    wash: 'bg-[#FBF2DA]',
    text: 'text-[#735000]',
    badge: 'bg-[#9E6E00] text-white',
  },
  6: {
    wash: 'bg-[#E8F4EC]',
    text: 'text-[#116B3F]',
    badge: 'bg-[#116B3F] text-white',
  },
};

interface LiveStats {
  totalFetched: number;
  apisSucceeded: string[];
  doisResolved: number;
  urlsResolved: number;
}

export function FeedbackStudio() {
  const { t } = useI18n();
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_MANUSCRIPTS[0].id);
  const [title, setTitle] = useState<string>(SAMPLE_MANUSCRIPTS[0].title);
  const [author, setAuthor] = useState<string>(SAMPLE_MANUSCRIPTS[0].author);
  const [text, setText] = useState<string>(SAMPLE_MANUSCRIPTS[0].text);

  const [viewerLayer, setViewerLayer] = useState<'similarity' | 'ai' | 'edit'>('similarity');
  const [activeTab, setActiveTab] = useState<'sources' | 'filters' | 'ai'>('sources');
  const [revealSub20Ai, setRevealSub20Ai] = useState<boolean>(false);

  const [exclusions, setExclusions] = useState<ExclusionOptions>({
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
    minPercentMatch: 0,
    denominatorMode: 'total',
  });

  const [sourceViewMode, setSourceViewMode] = useState<'primary' | 'all'>('primary');
  const [customSources, setCustomSources] = useState<CorpusSource[]>([]);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [uploadingRefDoc, setUploadingRefDoc] = useState<boolean>(false);

  const [extraFetchedSources, setExtraFetchedSources] = useState<CorpusSource[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [scanningWeb, setScanningWeb] = useState<boolean>(false);
  const [editorialCritique, setEditorialCritique] = useState<string>('');
  const [loadingCritique, setLoadingCritique] = useState<boolean>(false);

  const [selectedSourceRank, setSelectedSourceRank] = useState<number | null>(null);
  const [excludedSourceIds, setExcludedSourceIds] = useState<string[]>([]);
  const [showInboxTable, setShowInboxTable] = useState<boolean>(false);
  const [uploadedInboxItems, setUploadedInboxItems] = useState<
    Array<{
      id: string;
      paperId: string;
      title: string;
      author: string;
      course: string;
      text: string;
      simPct: number;
      aiPct: number;
      words: number;
    }>
  >([]);

  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadMeta, setUploadMeta] = useState<{
    fileName: string;
    fileType: string;
    byteSize: number;
    estimatedPages: number;
    wordCount: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync preset selection if opened via /studio?sample=...
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const sampleParam = sp.get('sample');
      if (sampleParam) {
        const found = SAMPLE_MANUSCRIPTS.find((s) => s.id === sampleParam);
        if (found) {
          setSelectedSampleId(found.id);
          setTitle(found.title);
          setAuthor(found.author);
          setText(found.text);
        }
      }
    } catch {}
  }, []);

  // Deterministic set-union Turnitin audit
  const audit: IntegrityAuditResult = useMemo(() => {
    return runManuscriptAudit(
      text,
      exclusions,
      [...customSources, ...extraFetchedSources],
      excludedSourceIds
    );
  }, [text, exclusions, customSources, extraFetchedSources, excludedSourceIds]);

  const bandStyle = getTurnitinBandStyle(audit.overallSimilarityPercent);

  const aiBreakdown = useMemo(() => {
    const sents = audit.stylometry.sentences;
    const totalW = sents.reduce((a, s) => a + s.wordCount, 0) || 1;
    const aiGenWords = sents
      .filter((s) => s.classification === 'synthetic')
      .reduce((a, s) => a + s.wordCount, 0);
    const aiParaphrasedWords = sents
      .filter((s) => s.classification === 'mixed')
      .reduce((a, s) => a + s.wordCount, 0);
    return {
      aiGeneratedOnlyPct: Number(((aiGenWords / totalW) * 100).toFixed(1)),
      aiParaphrasedPct: Number(((aiParaphrasedWords / totalW) * 100).toFixed(1)),
      aiGenWords,
      aiParaphrasedWords,
    };
  }, [audit.stylometry.sentences]);

  const inboxRows = useMemo(() => {
    const presets = SAMPLE_MANUSCRIPTS.map((s, idx) => {
      const a = runManuscriptAudit(s.text, {
        excludeQuotes: true,
        excludeBibliography: true,
        minWordMatch: 8,
        minPercentMatch: 0,
      });
      return {
        id: s.id,
        paperId: `CW-${1040 + idx + 1}`,
        title: s.title,
        author: s.author,
        course: s.course,
        text: s.text,
        simPct: a.overallSimilarityPercent,
        aiPct: a.stylometry.overallAiPercent,
        words: a.totalWords,
      };
    });
    return [...uploadedInboxItems, ...presets];
  }, [uploadedInboxItems]);

  const currentSample = useMemo(
    () => SAMPLE_MANUSCRIPTS.find((s) => s.id === selectedSampleId) || null,
    [selectedSampleId]
  );

  const benchmarkCalibration = useMemo(() => {
    if (!currentSample) return null;
    if (
      excludedSourceIds.length > 0 ||
      exclusions.minWordMatch !== 8 ||
      (exclusions.minPercentMatch ?? 0) !== 0 ||
      (exclusions.denominatorMode ?? 'total') !== 'total' ||
      exclusions.excludeQuotes !== exclusions.excludeBibliography
    ) {
      return null;
    }
    const expected =
      exclusions.excludeQuotes && exclusions.excludeBibliography
        ? currentSample.expectedExcludedSimilarity
        : currentSample.expectedTurnitinSimilarity;
    const delta = Math.abs(audit.overallSimilarityPercent - expected);
    return {
      expected: expected.toFixed(1),
      actual: audit.overallSimilarityPercent.toFixed(1),
      delta: delta.toFixed(1),
    };
  }, [
    currentSample,
    excludedSourceIds.length,
    exclusions.excludeQuotes,
    exclusions.excludeBibliography,
    exclusions.minWordMatch,
    exclusions.minPercentMatch,
    exclusions.denominatorMode,
    audit.overallSimilarityPercent,
  ]);

  const triggerLiveWebScan = useCallback(
    async (withVoiceCritique = false) => {
      if (!text.trim()) return;
      if (withVoiceCritique) setLoadingCritique(true);
      else setScanningWeb(true);

      try {
        const res = await fetch('/api/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            exclusions,
            excludedSourceIds,
            customSources,
            includeLiveWeb: true,
            runDeepVoiceAudit: withVoiceCritique,
          }),
        });
        const data = await res.json();
        if (data?.ok) {
          if (Array.isArray(data.liveSources)) {
            setExtraFetchedSources(data.liveSources);
          }
          if (data.liveSourceStats) {
            setLiveStats(data.liveSourceStats);
          }
          if (data.editorialCritique) {
            setEditorialCritique(data.editorialCritique);
          }
        }
      } catch {
        // Fallback preserves existing deterministic audit
      } finally {
        setScanningWeb(false);
        setLoadingCritique(false);
      }
    },
    [text, exclusions, excludedSourceIds, customSources]
  );

  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_MANUSCRIPTS.find((s) => s.id === sampleId);
    if (!found) return;
    setSelectedSampleId(found.id);
    setTitle(found.title);
    setAuthor(found.author);
    setText(found.text);
    setSelectedSourceRank(null);
    setExcludedSourceIds([]);
    setExtraFetchedSources([]);
    setLiveStats(null);
    setUploadMeta(null);
    setEditorialCritique('');
    setViewerLayer('similarity');
  };

  const processUploadedFile = async (file: File) => {
    setUploadingDoc(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data?.ok || !data?.parsed?.text) {
        throw new Error(
          data?.error || 'Could not extract readable text from the uploaded file.'
        );
      }

      const newId = `upload-${Date.now()}`;
      const newTitle = data.parsed.extractedTitle || file.name.replace(/\.[^.]+$/, '');
      const newAuthor = `Uploaded ${String(data.parsed.fileType).toUpperCase()} File`;
      setSelectedSampleId(newId);
      setTitle(newTitle);
      setAuthor(newAuthor);
      setText(data.parsed.text);
      setExcludedSourceIds([]);
      setSelectedSourceRank(null);

      const incomingLive = Array.isArray(data.liveSources) ? data.liveSources : [];
      setExtraFetchedSources(incomingLive);
      if (data.liveSourceStats) setLiveStats(data.liveSourceStats);

      if (data.audit) {
        setUploadedInboxItems((prev) => [
          {
            id: newId,
            paperId: `CW-${Math.floor(2000 + (Date.now() % 7999))}`,
            title: newTitle,
            author: newAuthor,
            course: `Uploaded ${String(data.parsed.fileType).toUpperCase()}`,
            text: data.parsed.text,
            simPct: data.audit.overallSimilarityPercent,
            aiPct: data.audit.stylometry.overallAiPercent,
            words: data.parsed.wordCount,
          },
          ...prev,
        ]);
      }

      setUploadMeta({
        fileName: data.parsed.fileName,
        fileType: String(data.parsed.fileType).toUpperCase(),
        byteSize: data.parsed.byteSize,
        estimatedPages: data.parsed.estimatedPages,
        wordCount: data.parsed.wordCount,
      });
      setViewerLayer('similarity');
    } catch (err) {
      const lower = file.name.toLowerCase();
      if (
        lower.endsWith('.txt') ||
        lower.endsWith('.md') ||
        lower.endsWith('.tex') ||
        lower.endsWith('.csv')
      ) {
        const rawContent = await file.text();
        setSelectedSampleId('custom-upload');
        setTitle(file.name.replace(/\.[^.]+$/, ''));
        setAuthor('Uploaded Draft');
        setText(rawContent.slice(0, 120000));
        setUploadMeta({
          fileName: file.name,
          fileType: 'TXT',
          byteSize: file.size,
          estimatedPages: Math.max(1, Math.ceil(rawContent.split(/\s+/).length / 280)),
          wordCount: rawContent.split(/\s+/).filter(Boolean).length,
        });
        setViewerLayer('similarity');
      } else {
        setUploadError(
          err instanceof Error
            ? err.message
            : 'Failed to parse uploaded document.'
        );
      }
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    e.target.value = '';
  };

  const handleDropFile = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
  };

  const handleExportDocx = async () => {
    try {
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export-docx',
          title,
          author,
          text,
        }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `citeward-manuscript-${audit.documentHashSha256.slice(0, 8)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleAddCustomSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    const newSource: CorpusSource = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || `Reference Document #${customSources.length + 1}`,
      authors: 'User Reference Source',
      publication: 'Direct Comparison Corpus',
      year: 2026,
      url: 'https://citeward.vercel.app/studio',
      category: 'publications',
      repository: 'Custom Reference Corpus',
      text: customText.trim(),
    };
    setCustomSources((prev) => [...prev, newSource]);
    setCustomTitle('');
    setCustomText('');
    setShowCustomForm(false);
  };

  const handleUploadReferenceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingRefDoc(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-document?mode=reference', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.parsed?.text) {
        throw new Error(data?.error || 'Could not extract readable text from reference file.');
      }
      const refSource: CorpusSource = {
        id: `custom-file-${Date.now()}`,
        title: customTitle.trim() || data.parsed.extractedTitle || file.name,
        authors: 'Uploaded Reference File',
        publication: `${String(data.parsed.fileType || 'DOC').toUpperCase()} Reference`,
        year: 2026,
        url: 'https://citeward.vercel.app/studio',
        category: 'publications',
        repository: 'User Reference File',
        text: data.parsed.text,
      };
      setCustomSources((prev) => [...prev, refSource]);
      setCustomTitle('');
      setCustomText('');
      setShowCustomForm(false);
    } catch (err) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.tex')) {
        const rawText = await file.text();
        if (rawText.trim()) {
          setCustomSources((prev) => [
            ...prev,
            {
              id: `custom-file-${Date.now()}`,
              title: customTitle.trim() || file.name,
              authors: 'Uploaded Reference File',
              publication: 'TXT Reference',
              year: 2026,
              url: 'https://citeward.vercel.app/studio',
              category: 'publications',
              repository: 'User Reference File',
              text: rawText.slice(0, 120000),
            },
          ]);
          setShowCustomForm(false);
        }
      } else {
        setUploadError(
          err instanceof Error ? err.message : 'Failed to parse reference file.'
        );
      }
    } finally {
      setUploadingRefDoc(false);
      e.target.value = '';
    }
  };

  const handleDownloadPdfReport = () => {
    const blob = generateAuditPdfBlob({
      title,
      author,
      audit,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citeward-report-${audit.documentHashSha256.slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build non-overlapping segments for document reader
  const documentSegments = useMemo(() => {
    if (!text) return [];
    if (viewerLayer === 'ai') {
      const showAi =
        revealSub20Ai ||
        (audit.stylometry.qualifyingAiWords >= 300 &&
          audit.stylometry.overallAiPercent >= 20);
      if (!showAi) {
        return [{ text, type: 'plain' as const }];
      }
      const sents = audit.stylometry.sentences;
      const out: Array<{
        text: string;
        type: 'plain' | 'ai';
        sentence?: (typeof sents)[number];
      }> = [];
      let cursor = 0;
      for (const s of sents) {
        if (s.startChar > cursor) {
          out.push({ text: text.slice(cursor, s.startChar), type: 'plain' });
        }
        if (s.startChar >= cursor && s.endChar <= text.length) {
          out.push({
            text: text.slice(s.startChar, s.endChar),
            type: 'ai',
            sentence: s,
          });
          cursor = s.endChar;
        }
      }
      if (cursor < text.length) {
        out.push({ text: text.slice(cursor), type: 'plain' });
      }
      return out;
    }

    const sorted = [...audit.activeSpans].sort(
      (a, b) => a.startChar - b.startChar || b.wordCount - a.wordCount
    );
    const merged: MatchSpan[] = [];
    for (const sp of sorted) {
      const last = merged[merged.length - 1];
      if (!last || sp.startChar >= last.endChar) {
        merged.push(sp);
      } else if (sp.wordCount > last.wordCount) {
        merged[merged.length - 1] = sp;
      }
    }

    const out: Array<{
      text: string;
      type: 'plain' | 'match';
      span?: MatchSpan;
    }> = [];
    let cursor = 0;
    for (const sp of merged) {
      if (sp.startChar > cursor) {
        out.push({ text: text.slice(cursor, sp.startChar), type: 'plain' });
      }
      out.push({
        text: text.slice(sp.startChar, sp.endChar),
        type: 'match',
        span: sp,
      });
      cursor = sp.endChar;
    }
    if (cursor < text.length) {
      out.push({ text: text.slice(cursor), type: 'plain' });
    }
    return out;
  }, [text, audit.activeSpans, audit.stylometry, viewerLayer, revealSub20Ai]);

  return (
    <section
      id="studio"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDropFile}
      className="py-5"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 space-y-4">
        {/* Clean Single-Row Studio Control Strip */}
        <div
          className={`rounded-[10px] border p-3.5 transition-colors bg-[var(--cw-raised)] shadow-[var(--cw-e1)] flex flex-wrap items-center justify-between gap-3 ${
            isDragOver
              ? 'border-2 border-dashed border-[var(--cw-signal)] bg-[var(--cw-signal-wash)]'
              : 'border-[var(--cw-rule-2)]'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.odt,.rtf,.txt,.md,.tex,.csv,.json,.html"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc}
              className="cw-btn-primary text-xs !py-2 !px-3.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {uploadingDoc ? 'Extracting Document...' : 'Upload .PDF / .DOCX'}
              </span>
            </button>

            <select
              aria-label="Select calibration sample paper"
              value={currentSample ? currentSample.id : ''}
              onChange={(e) => {
                if (e.target.value) handleSelectSample(e.target.value);
              }}
              className="cw-mono text-xs px-2.5 py-2 rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-[var(--cw-ink)] font-medium cursor-pointer"
            >
              {!currentSample && <option value="">Uploaded Document</option>}
              {SAMPLE_MANUSCRIPTS.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  Sample 0{idx + 1}: {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowInboxTable((prev) => !prev)}
              className={`cw-btn-ghost text-xs !py-2 !px-3 ${
                showInboxTable
                  ? '!border-[var(--cw-signal)] !bg-[var(--cw-signal-wash)]'
                  : ''
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Inbox ({inboxRows.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {liveStats && liveStats.totalFetched > 0 && (
              <span className="cw-mono text-[11px] px-2.5 py-1 rounded-[4px] bg-[var(--cw-good-wash)] text-[var(--cw-good)] font-semibold">
                {liveStats.totalFetched} live sources ({liveStats.apisSucceeded.length} APIs)
              </span>
            )}

            <button
              type="button"
              onClick={() => triggerLiveWebScan(false)}
              disabled={scanningWeb}
              className="cw-btn-ghost text-xs !py-2 !px-3"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanningWeb ? 'animate-spin' : ''}`} />
              <span>{scanningWeb ? 'Scanning APIs...' : 'Scan 11 Live APIs'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdfReport}
              className="cw-btn-ghost text-xs !py-2 !px-3"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>

        {/* Upload / Error Notices */}
        {uploadError && (
          <div className="rounded-[8px] border border-[var(--cw-bad)] bg-[var(--cw-bad-wash)] text-[var(--cw-bad)] px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-3">
            <span>{uploadError}</span>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="cw-mono underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {uploadMeta && (
          <div className="rounded-[8px] border border-[var(--cw-corpus-rule)] bg-[var(--cw-corpus-wash)] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[var(--cw-corpus-ink)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                [{uploadMeta.fileType}] {uploadMeta.fileName}
              </span>
              <span className="cw-mono">
                · {uploadMeta.estimatedPages} page(s) · {uploadMeta.wordCount.toLocaleString()} words
              </span>
            </div>
            <span className="cw-mono font-semibold text-[var(--cw-ink)]">
              Turnitin Score: {audit.roundedSimilarityPercent}% ({audit.overallSimilarityPercent.toFixed(1)}% exact)
            </span>
          </div>
        )}

        {/* Collapsible Turnitin Submission Inbox */}
        {showInboxTable && (
          <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex flex-wrap items-center justify-between gap-3">
              <span className="cw-mono text-xs font-bold uppercase tracking-wider text-[var(--cw-ink)]">
                Submission Inbox ({inboxRows.length} Manuscripts)
              </span>
              <a
                href="/api/parse-document?sample=docx&id=sample-1-thesis"
                download="citeward-sample-1-thesis.docx"
                className="cw-mono text-xs font-semibold text-[var(--cw-signal-ink)] hover:underline"
              >
                Download Sample .DOCX File
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--cw-rule)] bg-[var(--cw-paper)] cw-mono text-[11px] uppercase text-[var(--cw-ink-3)]">
                    <th scope="col" className="py-2.5 px-3.5">
                      ID
                    </th>
                    <th scope="col" className="py-2.5 px-3.5">
                      Author
                    </th>
                    <th scope="col" className="py-2.5 px-3.5">
                      Title
                    </th>
                    <th scope="col" className="py-2.5 px-3.5">
                      Similarity
                    </th>
                    <th scope="col" className="py-2.5 px-3.5">
                      Words
                    </th>
                    <th scope="col" className="py-2.5 px-3.5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cw-rule)]">
                  {inboxRows.map((row) => {
                    const isCurrent = selectedSampleId === row.id;
                    const rowBand = getTurnitinBandStyle(row.simPct);
                    return (
                      <tr
                        key={row.id}
                        className={
                          isCurrent
                            ? 'bg-[var(--cw-signal-wash)]/60'
                            : 'hover:bg-[var(--cw-sunken)]/60'
                        }
                      >
                        <td className="py-2.5 px-3.5 cw-mono text-[11px] text-[var(--cw-ink-3)]">
                          {row.paperId}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="font-semibold text-[var(--cw-ink)]">{row.author}</div>
                          <div className="text-[11px] text-[var(--cw-ink-3)]">{row.course}</div>
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-[var(--cw-ink)] max-w-[300px] truncate">
                          {row.title}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`cw-mono font-bold px-2 py-0.5 rounded border text-xs ${rowBand.badgeBg}`}
                          >
                            {Math.round(row.simPct)}% ({row.simPct.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 cw-mono text-[var(--cw-ink-2)]">
                          {row.words.toLocaleString()}w
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSampleId(row.id);
                              setTitle(row.title);
                              setAuthor(row.author);
                              setText(row.text);
                              setExcludedSourceIds([]);
                              setSelectedSourceRank(null);
                              setShowInboxTable(false);
                            }}
                            className="px-2.5 py-1 rounded-[5px] font-semibold text-xs cursor-pointer bg-[var(--cw-raised)] text-[var(--cw-signal-ink)] border border-[var(--cw-signal-rule)] hover:bg-[var(--cw-signal)] hover:text-white"
                          >
                            {isCurrent ? 'Active' : 'Open'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Turnitin 2-Column Document Viewer & Inspector Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Clean Paper Reader (8 cols) */}
          <div className="lg:col-span-8 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-[var(--cw-ink-3)] shrink-0" />
                <div className="min-w-0">
                  <input
                    type="text"
                    aria-label="Manuscript title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-semibold text-sm text-[var(--cw-ink)] bg-transparent border-b border-transparent focus:border-[var(--cw-signal)] focus:outline-none truncate max-w-[320px] sm:max-w-[440px] block"
                  />
                  <div className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
                    {author} · {audit.totalWords.toLocaleString()} words · Quotes {audit.quotedWords}w · References {audit.bibliographyWords}w
                  </div>
                </div>
              </div>

              <div className="inline-flex rounded-[5px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setViewerLayer('similarity');
                    setActiveTab('sources');
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] cursor-pointer ${
                    viewerLayer === 'similarity'
                      ? 'bg-[var(--cw-signal)] text-white font-semibold'
                      : 'text-[var(--cw-ink-2)]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Similarity</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewerLayer('ai');
                    setActiveTab('ai');
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] cursor-pointer ${
                    viewerLayer === 'ai'
                      ? 'bg-[var(--cw-signal)] text-white font-semibold'
                      : 'text-[var(--cw-ink-2)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Layer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewerLayer('edit')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] cursor-pointer ${
                    viewerLayer === 'edit'
                      ? 'bg-[var(--cw-signal)] text-white font-semibold'
                      : 'text-[var(--cw-ink-2)]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Text</span>
                </button>
              </div>
            </div>

            {viewerLayer === 'edit' ? (
              <div className="p-6">
                <textarea
                  aria-label="Edit manuscript text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={26}
                  placeholder="Paste manuscript prose here..."
                  className="w-full p-4 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-sm text-[var(--cw-ink)] leading-relaxed focus:outline-none focus:border-[var(--cw-signal)] font-sans"
                />
              </div>
            ) : (
              <div className="p-6 sm:p-10 bg-[var(--cw-paper)] min-h-[680px] text-[15px] leading-[1.85] text-[var(--cw-ink)] whitespace-pre-wrap break-words">
                {viewerLayer === 'ai' &&
                  (audit.stylometry.qualifyingAiWords < 300 ||
                    audit.stylometry.overallAiPercent < 20) &&
                  !revealSub20Ai && (
                    <div className="mb-6 p-4 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] text-xs text-[var(--cw-ink-2)] flex flex-wrap items-center justify-between gap-3 whitespace-normal">
                      <span>
                        Turnitin AI Writing Rule:{' '}
                        {audit.stylometry.qualifyingAiWords < 300
                          ? `Document has ${audit.stylometry.qualifyingAiWords} words (below 300-word prose threshold).`
                          : `Estimated score is ${audit.stylometry.overallAiPercent}% (below 20%, shown as *% to avoid false positives).`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRevealSub20Ai(true)}
                        className="cw-mono font-semibold text-[var(--cw-signal-ink)] hover:underline cursor-pointer"
                      >
                        Reveal Raw Cadence Highlights
                      </button>
                    </div>
                  )}

                {documentSegments.map((seg, i) => {
                  if (seg.type === 'ai' && seg.sentence) {
                    const s = seg.sentence;
                    const styleCls =
                      s.classification === 'synthetic'
                        ? 'bg-[#E5F4F8] text-[#045B70] rounded-[3px] px-0.5'
                        : s.classification === 'mixed'
                        ? 'bg-[#F3EBFA] text-[#5A238C] rounded-[3px] px-0.5'
                        : '';
                    return (
                      <span
                        key={i}
                        title={`Sentence #${s.index} · ${s.wordCount} words · Synthetic: ${s.aiProbability}%`}
                        className={styleCls}
                      >
                        {seg.text}
                      </span>
                    );
                  }

                  if (seg.type === 'match' && seg.span) {
                    const sp = seg.span;
                    const st = SERIES_STYLES[sp.colorIndex] || SERIES_STYLES[1];
                    const isSelected = selectedSourceRank === sp.sourceRank;
                    return (
                      <mark
                        key={i}
                        onClick={() => {
                          setActiveTab('sources');
                          setSelectedSourceRank(
                            selectedSourceRank === sp.sourceRank ? null : sp.sourceRank
                          );
                        }}
                        className={`cursor-pointer rounded-[3px] px-0.5 transition-colors ${
                          st.wash
                        } ${st.text} ${
                          isSelected ? 'ring-2 ring-[var(--cw-signal)]' : ''
                        }`}
                      >
                        <sup
                          className={`cw-mono inline-flex items-center justify-center rounded-full text-[9px] font-bold px-1 min-w-[15px] h-[15px] mr-1 align-super leading-none select-none ${st.badge}`}
                        >
                          {sp.sourceRank}
                        </sup>
                        {seg.text}
                      </mark>
                    );
                  }

                  return <React.Fragment key={i}>{seg.text}</React.Fragment>;
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Clean Turnitin Layer Panel (4 cols) */}
          <div className="lg:col-span-4 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] overflow-hidden sticky top-20">
            {/* Turnitin Dual Score Banner */}
            <div className="p-4 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setViewerLayer('similarity');
                  setActiveTab('sources');
                }}
                className={`text-left p-3.5 rounded-[8px] border bg-[var(--cw-raised)] transition-colors cursor-pointer ${
                  activeTab === 'sources' || activeTab === 'filters'
                    ? 'border-[var(--cw-corpus)]'
                    : 'border-[var(--cw-rule)] hover:border-[var(--cw-rule-2)]'
                }`}
              >
                <div className="cw-mono text-[10px] uppercase tracking-wider text-[var(--cw-ink-3)]">
                  Similarity Score
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`cw-mono text-4xl font-bold ${bandStyle.scoreText}`}>
                    {audit.roundedSimilarityPercent}%
                  </span>
                </div>
                <div className="cw-mono text-[11px] text-[var(--cw-ink-3)] mt-1">
                  {audit.matchedWords}/{audit.evaluableWords}w · {audit.overallSimilarityPercent.toFixed(1)}% exact
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewerLayer('ai');
                  setActiveTab('ai');
                }}
                className={`text-left p-3.5 rounded-[8px] border bg-[var(--cw-raised)] transition-colors cursor-pointer ${
                  activeTab === 'ai'
                    ? 'border-[var(--cw-stylo)]'
                    : 'border-[var(--cw-rule)] hover:border-[var(--cw-rule-2)]'
                }`}
              >
                <div className="cw-mono text-[10px] uppercase tracking-wider text-[var(--cw-ink-3)]">
                  AI Writing Indicator
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="cw-mono text-4xl font-bold text-[var(--cw-corpus-ink)]">
                    {audit.stylometry.turnitinAiIndicator}
                  </span>
                </div>
                <div className="cw-mono text-[11px] text-[var(--cw-ink-3)] mt-1">
                  Est. {audit.stylometry.overallAiPercent.toFixed(1)}% · {audit.stylometry.qualifyingAiWords}w prose
                </div>
              </button>
            </div>

            {/* 3 Clean Turnitin Tabs */}
            <div
              role="tablist"
              aria-label="Turnitin inspector tabs"
              className="grid grid-cols-3 border-b border-[var(--cw-rule)] bg-[var(--cw-paper)] text-xs font-semibold"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'sources'}
                onClick={() => setActiveTab('sources')}
                className={`py-2.5 px-2 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'sources'
                    ? 'border-[#B3261E] text-[#B3261E] bg-[var(--cw-raised)]'
                    : 'border-transparent text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                }`}
              >
                Sources ({audit.sources.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'filters'}
                onClick={() => setActiveTab('filters')}
                className={`py-2.5 px-2 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'filters'
                    ? 'border-[#B3261E] text-[#B3261E] bg-[var(--cw-raised)]'
                    : 'border-transparent text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                }`}
              >
                Filters &amp; Math
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'ai'}
                onClick={() => setActiveTab('ai')}
                className={`py-2.5 px-2 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'ai'
                    ? 'border-[var(--cw-corpus)] text-[var(--cw-corpus-ink)] bg-[var(--cw-raised)]'
                    : 'border-transparent text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                }`}
              >
                AI Report
              </button>
            </div>

            {/* TAB 1: MATCH OVERVIEW (SOURCES) */}
            {activeTab === 'sources' && (
              <div className="p-4 space-y-3.5 max-h-[580px] overflow-y-auto">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-[6px] bg-[var(--cw-sunken)] border border-[var(--cw-rule)]">
                    <div className="cw-mono text-sm font-bold text-[var(--cw-ink)]">
                      {audit.internetPercent}%
                    </div>
                    <div className="text-[11px] text-[var(--cw-ink-3)]">Internet</div>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[var(--cw-sunken)] border border-[var(--cw-rule)]">
                    <div className="cw-mono text-sm font-bold text-[var(--cw-ink)]">
                      {audit.publicationsPercent}%
                    </div>
                    <div className="text-[11px] text-[var(--cw-ink-3)]">Publications</div>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[var(--cw-sunken)] border border-[var(--cw-rule)]">
                    <div className="cw-mono text-sm font-bold text-[var(--cw-ink)]">
                      {audit.studentPapersPercent}%
                    </div>
                    <div className="text-[11px] text-[var(--cw-ink-3)]">Student Papers</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div
                    role="group"
                    aria-label="Turnitin source view mode"
                    className="inline-flex rounded-[4px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)] p-0.5 cw-mono text-[11px]"
                  >
                    <button
                      type="button"
                      onClick={() => setSourceViewMode('primary')}
                      className={`px-2 py-0.5 rounded-[3px] cursor-pointer ${
                        sourceViewMode === 'primary'
                          ? 'bg-[var(--cw-raised)] text-[var(--cw-ink)] font-semibold'
                          : 'text-[var(--cw-ink-3)]'
                      }`}
                    >
                      Primary Sources
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceViewMode('all')}
                      className={`px-2 py-0.5 rounded-[3px] cursor-pointer ${
                        sourceViewMode === 'all'
                          ? 'bg-[var(--cw-raised)] text-[var(--cw-ink)] font-semibold'
                          : 'text-[var(--cw-ink-3)]'
                      }`}
                    >
                      All Sources
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {excludedSourceIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExcludedSourceIds([])}
                        className="cw-mono text-[11px] font-semibold text-[var(--cw-bad)] hover:underline cursor-pointer"
                      >
                        Restore ({excludedSourceIds.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCustomForm((s) => !s)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--cw-signal-ink)] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Compare File / Text</span>
                    </button>
                  </div>
                </div>

                {showCustomForm && (
                  <form
                    onSubmit={handleAddCustomSource}
                    className="p-3 rounded-[8px] border border-[var(--cw-signal-rule)] bg-[var(--cw-signal-wash)] space-y-2"
                  >
                    <div className="text-xs font-semibold text-[var(--cw-ink)]">
                      Add Reference File or Source Passage
                    </div>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Source title (e.g., Advisor Reference Paper)"
                      className="w-full px-2.5 py-1.5 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] text-xs text-[var(--cw-ink)]"
                    />
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={3}
                      placeholder={t.studio.customSourcePlaceholder}
                      className="w-full p-2 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] text-xs text-[var(--cw-ink)]"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="submit" className="cw-btn-primary text-xs !py-1.5 !px-3">
                        Add Text
                      </button>
                      <input
                        ref={refFileInputRef}
                        type="file"
                        accept=".pdf,.docx,.odt,.rtf,.txt,.md,.tex"
                        onChange={handleUploadReferenceFile}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => refFileInputRef.current?.click()}
                        disabled={uploadingRefDoc}
                        className="cw-btn-ghost text-xs !py-1.5 !px-3"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {uploadingRefDoc ? 'Parsing...' : 'Upload Ref .PDF/.DOCX'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                {audit.sources.length === 0 ? (
                  <div className="p-5 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)] text-center space-y-1.5">
                    <div className="font-semibold text-sm text-[var(--cw-ink)]">
                      No matching sources under active filters
                    </div>
                    <p className="text-xs text-[var(--cw-ink-3)] leading-relaxed">
                      Zero runs met the active threshold across open scholarly APIs and loaded
                      references. Click &ldquo;Scan 11 Live APIs&rdquo; or upload a reference
                      .PDF/.DOCX above to compare directly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {audit.sources.map((item) => {
                      const st = SERIES_STYLES[item.colorIndex] || SERIES_STYLES[1];
                      const expanded = selectedSourceRank === item.rank;
                      const displayPct =
                        sourceViewMode === 'primary'
                          ? item.primarySimilarityPercent
                          : item.similarityPercent;
                      const displayWords =
                        sourceViewMode === 'primary'
                          ? item.primaryMatchedWords
                          : item.matchedWords;
                      const roundedItemPct =
                        displayWords === 0 ? 0 : Math.max(1, Math.round(displayPct));

                      return (
                        <div
                          key={item.source.id}
                          className={`rounded-[8px] border transition-colors ${
                            expanded
                              ? 'border-[var(--cw-signal)] bg-[var(--cw-sunken)]'
                              : 'border-[var(--cw-rule)] bg-[var(--cw-paper)]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSourceRank(expanded ? null : item.rank)
                            }
                            aria-expanded={expanded}
                            className="w-full text-left p-3 flex items-start justify-between gap-2.5 cursor-pointer"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span
                                className={`cw-mono text-[11px] font-bold px-2 py-0.5 rounded-[4px] shrink-0 ${st.badge}`}
                              >
                                {item.rank}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-[var(--cw-ink)] leading-snug line-clamp-2">
                                  {item.source.title}
                                </div>
                                <div className="text-[11px] text-[var(--cw-ink-3)] mt-0.5 truncate">
                                  {item.source.repository} · {item.source.year}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="cw-mono text-sm font-bold text-[var(--cw-ink)]">
                                {roundedItemPct}%
                              </div>
                              <div className="cw-mono text-[10px] text-[var(--cw-ink-3)]">
                                {displayWords}w ({displayPct}%)
                              </div>
                            </div>
                          </button>

                          {expanded && (
                            <div className="px-3 pb-3 pt-2 border-t border-[var(--cw-rule)] space-y-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExcludedSourceIds((prev) =>
                                      prev.includes(item.source.id)
                                        ? prev
                                        : [...prev, item.source.id]
                                    );
                                    setSelectedSourceRank(null);
                                  }}
                                  className="cw-mono text-[11px] font-semibold text-[var(--cw-bad)] hover:underline cursor-pointer"
                                >
                                  Exclude Source
                                </button>
                                <a
                                  href={item.source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--cw-signal-ink)] hover:underline"
                                >
                                  <span>Open Source</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <div className="p-2.5 rounded-[5px] bg-[var(--cw-raised)] border border-[var(--cw-rule)] text-[var(--cw-ink-2)] text-[11px] leading-relaxed max-h-[140px] overflow-y-auto">
                                {item.source.text}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TURNITIN FILTERS & MATHEMATICAL PROOF */}
            {activeTab === 'filters' && (
              <div className="p-4 space-y-4 text-xs">
                <div className="space-y-3">
                  <div className="cw-mono text-[11px] uppercase tracking-wider font-semibold text-[var(--cw-ink-3)]">
                    Turnitin Filter &amp; Exclusion Settings
                  </div>

                  <label className="flex items-center justify-between p-2.5 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] cursor-pointer">
                    <span className="flex items-center gap-2 font-medium text-[var(--cw-ink)]">
                      <input
                        type="checkbox"
                        checked={exclusions.excludeQuotes}
                        onChange={(e) =>
                          setExclusions((prev) => ({
                            ...prev,
                            excludeQuotes: e.target.checked,
                          }))
                        }
                        className="rounded accent-[var(--cw-signal)]"
                      />
                      <span>Exclude Quotes (&ldquo;...&rdquo;)</span>
                    </span>
                    <span className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
                      {audit.quotedWords}w
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] cursor-pointer">
                    <span className="flex items-center gap-2 font-medium text-[var(--cw-ink)]">
                      <input
                        type="checkbox"
                        checked={exclusions.excludeBibliography}
                        onChange={(e) =>
                          setExclusions((prev) => ({
                            ...prev,
                            excludeBibliography: e.target.checked,
                          }))
                        }
                        className="rounded accent-[var(--cw-signal)]"
                      />
                      <span>Exclude Bibliography / Daftar Pustaka</span>
                    </span>
                    <span className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
                      {audit.bibliographyWords}w
                    </span>
                  </label>

                  <div className="p-2.5 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-2">
                    <div className="font-medium text-[var(--cw-ink)]">
                      Exclude sources that are less than:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-[11px] text-[var(--cw-ink-3)] block">
                          Word Threshold
                        </span>
                        <select
                          aria-label="Minimum matched words"
                          value={exclusions.minWordMatch}
                          onChange={(e) =>
                            setExclusions((prev) => ({
                              ...prev,
                              minWordMatch: Number(e.target.value),
                            }))
                          }
                          className="w-full cw-mono text-xs px-2 py-1.5 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] text-[var(--cw-ink)]"
                        >
                          <option value={0}>Off (3+ words)</option>
                          <option value={5}>5 words</option>
                          <option value={8}>8 words (Standard)</option>
                          <option value={12}>12 words</option>
                          <option value={20}>20 words</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-[11px] text-[var(--cw-ink-3)] block">
                          Source % Threshold
                        </span>
                        <select
                          aria-label="Minimum source percentage"
                          value={exclusions.minPercentMatch ?? 0}
                          onChange={(e) =>
                            setExclusions((prev) => ({
                              ...prev,
                              minPercentMatch: Number(e.target.value),
                            }))
                          }
                          className="w-full cw-mono text-xs px-2 py-1.5 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] text-[var(--cw-ink)]"
                        >
                          <option value={0}>0% (Off)</option>
                          <option value={1}>1%</option>
                          <option value={2}>2%</option>
                          <option value={3}>3%</option>
                          <option value={5}>5%</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <label className="block p-2.5 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-1">
                    <span className="font-medium text-[var(--cw-ink)] block">
                      Denominator Formula Mode
                    </span>
                    <select
                      aria-label="Denominator calculation rule"
                      value={exclusions.denominatorMode ?? 'total'}
                      onChange={(e) =>
                        setExclusions((prev) => ({
                          ...prev,
                          denominatorMode: e.target.value as 'total' | 'evaluable',
                        }))
                      }
                      className="w-full cw-mono text-xs px-2 py-1.5 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] text-[var(--cw-ink)]"
                    >
                      <option value="total">Total Submission Words (Turnitin Standard)</option>
                      <option value="evaluable">Net Prose (Subtract Excluded Quotes/Bib)</option>
                    </select>
                  </label>
                </div>

                {/* Live Turnitin Arithmetic Proof Ledger */}
                <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] space-y-1.5 cw-mono text-[11px]">
                  <div className="font-bold uppercase text-[var(--cw-ink)] mb-1">
                    Live Set-Union Calculation Proof
                  </div>
                  <div className="flex justify-between text-[var(--cw-ink-2)]">
                    <span>Matched Unique Words (M):</span>
                    <span className="font-bold text-[var(--cw-ink)]">{audit.matchedWords}</span>
                  </div>
                  <div className="flex justify-between text-[var(--cw-ink-2)]">
                    <span>Denominator Words (D):</span>
                    <span className="font-bold text-[var(--cw-ink)]">{audit.evaluableWords}</span>
                  </div>
                  <div className="flex justify-between text-[var(--cw-ink-2)]">
                    <span>Ratio (M / D * 100):</span>
                    <span className="font-bold text-[var(--cw-corpus-ink)]">
                      {audit.overallSimilarityPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--cw-ink-2)] border-t border-[var(--cw-rule)] pt-1.5">
                    <span>Turnitin Integer Rounding:</span>
                    <span className="font-bold text-[var(--cw-ink)]">
                      {audit.roundedSimilarityPercent}%
                    </span>
                  </div>
                  {benchmarkCalibration && (
                    <div className="flex justify-between text-[var(--cw-good)] font-bold pt-1">
                      <span>Turnitin Benchmark Delta:</span>
                      <span>{benchmarkCalibration.delta}% Exact</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: AI WRITING BREAKDOWN */}
            {activeTab === 'ai' && (
              <div className="p-4 space-y-3.5 max-h-[580px] overflow-y-auto text-xs">
                <div className="p-3 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="cw-mono font-bold uppercase text-[11px] text-[var(--cw-ink-2)]">
                      Turnitin AI Writing Channels
                    </span>
                    <span className="cw-mono font-bold text-[var(--cw-corpus-ink)]">
                      Indicator: {audit.stylometry.turnitinAiIndicator}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded bg-[var(--cw-raised)] border-l-4 border-[#027A94] border border-[var(--cw-rule)]">
                      <div className="text-[11px] text-[var(--cw-ink-3)]">
                        AI-generated only (Cyan)
                      </div>
                      <div className="cw-mono text-base font-bold text-[#045B70] mt-0.5">
                        {aiBreakdown.aiGeneratedOnlyPct}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--cw-raised)] border-l-4 border-[#5A238C] border border-[var(--cw-rule)]">
                      <div className="text-[11px] text-[var(--cw-ink-3)]">
                        AI-paraphrased (Purple)
                      </div>
                      <div className="cw-mono text-base font-bold text-[#5A238C] mt-0.5">
                        {aiBreakdown.aiParaphrasedPct}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--cw-ink)]">
                      {audit.stylometry.verdictLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerLiveWebScan(true)}
                      disabled={loadingCritique}
                      className="cw-mono text-[11px] text-[var(--cw-signal-ink)] hover:underline cursor-pointer"
                    >
                      {loadingCritique ? 'Analyzing...' : 'Refresh Critique'}
                    </button>
                  </div>
                  <p className="text-[var(--cw-ink-2)] leading-relaxed">
                    {editorialCritique || audit.stylometry.verdictSummary}
                  </p>
                </div>

                <Link href="/paraphrase" className="cw-btn-primary text-xs w-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open in Anti-AI Paraphrase Studio</span>
                </Link>

                <div className="space-y-2">
                  {audit.stylometry.sentences.slice(0, 14).map((s) => (
                    <div
                      key={s.index}
                      className="p-2.5 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] space-y-1"
                    >
                      <div className="flex items-center justify-between cw-mono text-[11px]">
                        <span className="text-[var(--cw-ink-3)]">
                          Sentence #{s.index} · {s.wordCount}w
                        </span>
                        <span className="font-semibold text-[var(--cw-ink)]">
                          {s.classification.toUpperCase()} ({s.aiProbability}%)
                        </span>
                      </div>
                      <p className="text-[var(--cw-ink)] line-clamp-2">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiet Utility Footer inside Studio Sidebar */}
            <div className="px-4 py-2.5 border-t border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex items-center justify-between gap-2 text-[11px] cw-mono">
              <button
                type="button"
                onClick={handleExportDocx}
                className="text-[var(--cw-ink-2)] hover:text-[var(--cw-ink)] hover:underline cursor-pointer"
              >
                Export .DOCX
              </button>
              <Link
                href="/verify"
                className="inline-flex items-center gap-1 text-[var(--cw-signal-ink)] hover:underline"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Timestamp Receipt (/verify)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

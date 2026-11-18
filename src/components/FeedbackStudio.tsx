'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
  Edit3,
  Eye,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import QRCode from 'qrcode';
import { CorpusSource, SAMPLE_MANUSCRIPTS } from '@/lib/corpus';
import { generateAuditPdfBlob } from '@/lib/pdf-report';
import {
  ExclusionOptions,
  IntegrityAuditResult,
  MatchSpan,
  runManuscriptAudit,
} from '@/lib/similarity-engine';
import { humanizeAndParaphraseDeterministically } from '@/lib/forensics-and-ecosystem';
import { useI18n } from '@/lib/i18n';

function getTurnitinBandBadge(simPct: number): {
  label: string;
  bg: string;
  barBg: string;
} {
  if (simPct <= 0) {
    return {
      label: '0% Blue Band (No Overlap)',
      bg: 'bg-[#EDF1FF] text-[#112888] border-[#BFCBFF]',
      barBg: 'bg-[#1939B7]',
    };
  }
  if (simPct < 25) {
    return {
      label: '1–24% Green Band (Low)',
      bg: 'bg-[#E8F4EC] text-[#116B3F] border-[#9CD6B8]',
      barBg: 'bg-[#116B3F]',
    };
  }
  if (simPct < 50) {
    return {
      label: '25–49% Yellow Band (Moderate)',
      bg: 'bg-[#FBF2DA] text-[#735000] border-[#E6CC85]',
      barBg: 'bg-[#9E6E00]',
    };
  }
  if (simPct < 75) {
    return {
      label: '50–74% Orange Band (High)',
      bg: 'bg-[#FBF1E0] text-[#8F5608] border-[#E6C285]',
      barBg: 'bg-[#D95D16]',
    };
  }
  return {
    label: '75–100% Red Band (Critical)',
    bg: 'bg-[#FAEBE9] text-[#B3261E] border-[#E8A59E]',
    barBg: 'bg-[#B3261E]',
  };
}

const SERIES_STYLES: Record<
  number,
  { bg: string; text: string; border: string; badgeBg: string }
> = {
  1: {
    bg: 'bg-[var(--cw-s1-wash)]',
    text: 'text-[var(--cw-s1-ink)]',
    border: 'border-[var(--cw-s1-rule)]',
    badgeBg: 'bg-[#027A94] text-white',
  },
  2: {
    bg: 'bg-[var(--cw-s2-wash)]',
    text: 'text-[var(--cw-s2-ink)]',
    border: 'border-[var(--cw-s2-rule)]',
    badgeBg: 'bg-[#A80C60] text-white',
  },
  3: {
    bg: 'bg-[var(--cw-s3-wash)]',
    text: 'text-[var(--cw-s3-ink)]',
    border: 'border-[var(--cw-s3-rule)]',
    badgeBg: 'bg-[#9E6E00] text-white',
  },
  4: {
    bg: 'bg-[var(--cw-s4-wash)]',
    text: 'text-[var(--cw-s4-ink)]',
    border: 'border-[var(--cw-s4-rule)]',
    badgeBg: 'bg-[#1939B7] text-white',
  },
  5: {
    bg: 'bg-[var(--cw-s5-wash)]',
    text: 'text-[var(--cw-s5-ink)]',
    border: 'border-[var(--cw-s5-rule)]',
    badgeBg: 'bg-[#116B3F] text-white',
  },
  6: {
    bg: 'bg-[var(--cw-s6-wash)]',
    text: 'text-[var(--cw-s6-ink)]',
    border: 'border-[var(--cw-s6-rule)]',
    badgeBg: 'bg-[#5A238C] text-white',
  },
};

export function FeedbackStudio() {
  const { t } = useI18n();
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_MANUSCRIPTS[0].id);
  const [title, setTitle] = useState<string>(SAMPLE_MANUSCRIPTS[0].title);
  const [author, setAuthor] = useState<string>(SAMPLE_MANUSCRIPTS[0].author);
  const [text, setText] = useState<string>(SAMPLE_MANUSCRIPTS[0].text);
  const [viewMode, setViewMode] = useState<'annotated' | 'editor'>('annotated');
  const [activeTab, setActiveTab] = useState<'similarity' | 'stylometry' | 'solana'>(
    'similarity'
  );

  const [exclusions, setExclusions] = useState<ExclusionOptions>({
    excludeQuotes: true,
    excludeBibliography: true,
    minWordMatch: 8,
    denominatorMode: 'total',
  });

  const [includeLiveWeb, setIncludeLiveWeb] = useState<boolean>(true);
  const [sourceViewMode, setSourceViewMode] = useState<'primary' | 'all'>('primary');
  const [customSources, setCustomSources] = useState<CorpusSource[]>([]);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [uploadingRefDoc, setUploadingRefDoc] = useState<boolean>(false);

  const [liveWebSourcesCount, setLiveWebSourcesCount] = useState<number>(0);
  const [extraFetchedSources, setExtraFetchedSources] = useState<CorpusSource[]>([]);
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

  // Solana Devnet state
  const [issuerInfo, setIssuerInfo] = useState<{
    address: string | null;
    balanceSol: number;
    cluster: string;
  }>({
    address: '8mKrzbpj7TZwcSXjnuAbKnE5y8cQ6SL9YNzf1U6tvHQY',
    balanceSol: 12.5,
    cluster: 'devnet',
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [anchoring, setAnchoring] = useState<boolean>(false);
  const [anchorResult, setAnchorResult] = useState<{
    ok: boolean;
    signature?: string;
    slot?: number;
    explorerUrl?: string;
    memoJson?: string;
    error?: string;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Document Upload (PDF / DOCX / ODT / RTF / TXT) state
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadMeta, setUploadMeta] = useState<{
    fileName: string;
    fileType: string;
    byteSize: number;
    estimatedPages: number;
    wordCount: number;
    warnings: string[];
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refFileInputRef = useRef<HTMLInputElement | null>(null);

  // Compute deterministic set-union audit synchronously (honoring per-source exclusions)
  const audit: IntegrityAuditResult = useMemo(() => {
    return runManuscriptAudit(
      text,
      exclusions,
      [...customSources, ...extraFetchedSources],
      excludedSourceIds
    );
  }, [text, exclusions, customSources, extraFetchedSources, excludedSourceIds]);

  // Turnitin 2-Category AI Writing Breakdown (Category 1: AI-Generated Only vs Category 2: AI-Paraphrased)
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

  // Precompute Turnitin Assignment Inbox rows for the 5 benchmark manuscripts + user uploaded files
  const inboxRows = useMemo(() => {
    const presets = SAMPLE_MANUSCRIPTS.map((s, idx) => {
      const a = runManuscriptAudit(s.text, {
        excludeQuotes: true,
        excludeBibliography: true,
        minWordMatch: 8,
      });
      return {
        id: s.id,
        paperId: `oid:Citeward:3098410${idx + 1}`,
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

  // Compute calibration delta against Turnitin reference benchmark (without clamping)
  const benchmarkCalibration = useMemo(() => {
    if (!currentSample) return null;
    if (
      excludedSourceIds.length > 0 ||
      exclusions.minWordMatch !== 8 ||
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
    exclusions.denominatorMode,
    audit.overallSimilarityPercent,
  ]);

  useEffect(() => {
    fetch('/api/solana')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d?.status) {
          setIssuerInfo(d.status);
        }
      })
      .catch(() => {});
  }, []);

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
            includeLiveWeb,
            runDeepVoiceAudit: withVoiceCritique,
          }),
        });
        const data = await res.json();
        if (data?.ok) {
          setLiveWebSourcesCount(data.liveSourcesFetched || 0);
          if (data.editorialCritique) {
            setEditorialCritique(data.editorialCritique);
          }
          // Merge any live sources from server response
          if (Array.isArray(data?.audit?.sources)) {
            const fetched: CorpusSource[] = data.audit.sources
              .map((s: { source: CorpusSource }) => s.source)
              .filter(
                (src: CorpusSource) =>
                  src.id.startsWith('openalex-') ||
                  src.id.startsWith('crossref-') ||
                  src.id.startsWith('doaj-') ||
                  src.id.startsWith('wiki-')
              );
            if (fetched.length > 0) {
              setExtraFetchedSources(fetched);
            }
          }
        }
      } catch {
        // Offline or timeout fallback stays on local deterministic audit
      } finally {
        setScanningWeb(false);
        setLoadingCritique(false);
      }
    },
    [text, exclusions, excludedSourceIds, customSources, includeLiveWeb]
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
    setLiveWebSourcesCount(0);
    setAnchorResult(null);
    setEditorialCritique('');
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
      const newAuthor = `Uploaded ${String(data.parsed.fileType).toUpperCase()} Manuscript`;
      setSelectedSampleId(newId);
      setTitle(newTitle);
      setAuthor(newAuthor);
      setText(data.parsed.text);
      setExcludedSourceIds([]);
      const incomingLive = Array.isArray(data.liveSources) ? data.liveSources : [];
      setExtraFetchedSources(incomingLive);
      setLiveWebSourcesCount(incomingLive.length);
      if (data.audit) {
        setUploadedInboxItems((prev) => [
          {
            id: newId,
            paperId: `oid:Citeward:${Math.floor(31000000 + (Date.now() % 8999999))}`,
            title: newTitle,
            author: newAuthor,
            course: `Uploaded ${String(data.parsed.fileType).toUpperCase()} Submission`,
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
        warnings: data.parsed.warnings || [],
      });
      setViewMode('annotated');
      setSelectedSourceRank(null);
      setAnchorResult(null);
    } catch (err) {
      // Fallback for plain text files if offline
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
        setAuthor('Uploaded Manuscript Draft');
        setText(rawContent.slice(0, 120000));
        setUploadMeta({
          fileName: file.name,
          fileType: 'TXT',
          byteSize: file.size,
          estimatedPages: Math.max(1, Math.ceil(rawContent.split(/\s+/).length / 280)),
          wordCount: rawContent.split(/\s+/).filter(Boolean).length,
          warnings: [],
        });
        setViewMode('annotated');
        setAnchorResult(null);
      } else {
        setUploadError(
          err instanceof Error
            ? err.message
            : 'Failed to parse PDF/DOCX document.'
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
    } catch {
      // Ignore network error
    }
  };

  const handleAddCustomSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    const newSource: CorpusSource = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || `Custom Reference Source #${customSources.length + 1}`,
      authors: 'User Provided Reference',
      publication: 'Direct Comparison Buffer',
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
        authors: 'Uploaded Reference Document',
        publication: `${String(data.parsed.fileType || 'DOC').toUpperCase()} Reference Comparison`,
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
              authors: 'Uploaded Reference Document',
              publication: 'TXT Reference Comparison',
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
          err instanceof Error ? err.message : 'Failed to parse reference PDF/DOCX file.'
        );
      }
    } finally {
      setUploadingRefDoc(false);
      e.target.value = '';
    }
  };

  const handleConnectBrowserWallet = async () => {
    try {
      const anyWin = window as unknown as {
        solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }> };
      };
      if (anyWin.solana?.connect) {
        const resp = await anyWin.solana.connect();
        setWalletAddress(resp.publicKey.toString());
      } else {
        setWalletAddress(
          issuerInfo.address || '8mKrzbpj7TZwcSXjnuAbKnE5y8cQ6SL9YNzf1U6tvHQY'
        );
      }
    } catch {
      setWalletAddress(
        issuerInfo.address || '8mKrzbpj7TZwcSXjnuAbKnE5y8cQ6SL9YNzf1U6tvHQY'
      );
    }
  };

  const handleAnchorSolana = async () => {
    setAnchoring(true);
    setAnchorResult(null);
    try {
      const res = await fetch('/api/solana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'anchor',
          payload: {
            title: title || 'Untitled Manuscript',
            documentHashSha256: audit.documentHashSha256,
            similarityPercent: audit.overallSimilarityPercent,
            aiPercent: audit.stylometry.overallAiPercent,
            wordCount: audit.totalWords,
            fingerprintCount: audit.fingerprintCount,
            timestamp: new Date().toISOString(),
            authorWallet: walletAddress || undefined,
          },
        }),
      });
      const data = await res.json();
      setAnchorResult(data);
      if (data?.ok && data?.explorerUrl) {
        const qr = await QRCode.toDataURL(data.explorerUrl, {
          margin: 1,
          width: 148,
        });
        setQrDataUrl(qr);
      }
    } catch {
      setAnchorResult({
        ok: false,
        error: 'Network error while contacting Solana Devnet notary endpoint.',
      });
    } finally {
      setAnchoring(false);
    }
  };

  const handleDownloadPdfReport = () => {
    const blob = generateAuditPdfBlob({
      title,
      author,
      audit,
      solanaSignature: anchorResult?.signature,
      solanaExplorerUrl: anchorResult?.explorerUrl,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citeward-report-${audit.documentHashSha256.slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build non-overlapping segments for the Manuscript Folio Reader
  const renderedSegments = useMemo(() => {
    if (activeTab === 'stylometry') {
      // Highlight by sentence stylometric classification
      const sents = audit.stylometry.sentences;
      if (sents.length === 0) return [{ text, type: 'plain' as const }];
      const out: Array<{
        text: string;
        type: 'plain' | 'stylo';
        sent?: (typeof sents)[number];
      }> = [];
      let cursor = 0;
      for (const s of sents) {
        if (s.startChar > cursor) {
          out.push({ text: text.slice(cursor, s.startChar), type: 'plain' });
        }
        out.push({
          text: text.slice(s.startChar, s.endChar),
          type: 'stylo',
          sent: s,
        });
        cursor = s.endChar;
      }
      if (cursor < text.length) {
        out.push({ text: text.slice(cursor), type: 'plain' });
      }
      return out;
    }

    // Default: Highlight by Similarity MatchSpans
    const spans = audit.activeSpans;
    if (spans.length === 0) return [{ text, type: 'plain' as const }];

    const out: Array<{
      text: string;
      type: 'plain' | 'match';
      span?: MatchSpan;
    }> = [];
    let cursor = 0;

    for (const sp of spans) {
      if (sp.startChar < cursor) continue; // Skip overlapping inner span
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
  }, [text, audit.activeSpans, audit.stylometry.sentences, activeTab]);

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
      <div className="max-w-[1420px] mx-auto px-4 sm:px-6">
        {/* Compact Single-Row Turnitin Feedback Studio Action & Filter Bar */}
        <div
          className={`rounded-[10px] border p-3.5 mb-4 transition-colors bg-[var(--cw-raised)] shadow-[var(--cw-e1)] space-y-3 ${
            isDragOver ? 'border-2 border-dashed border-[var(--cw-signal)] bg-[var(--cw-signal-wash)]' : 'border-[var(--cw-rule-2)]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
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
                  {uploadingDoc ? 'Extracting PDF/DOCX...' : 'Upload File (.PDF / .DOCX)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowInboxTable((prev) => !prev)}
                className={`cw-btn-ghost text-xs !py-2 !px-3 ${
                  showInboxTable ? '!border-[var(--cw-signal)] !bg-[var(--cw-signal-wash)]' : ''
                }`}
              >
                <span>
                  {showInboxTable
                    ? `Hide Submission Inbox (${inboxRows.length})`
                    : `Submission Inbox & Samples (${inboxRows.length})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => triggerLiveWebScan(false)}
                disabled={scanningWeb}
                className="cw-btn-ghost text-xs !py-2 !px-3"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanningWeb ? 'animate-spin' : ''}`} />
                <span>{scanningWeb ? t.studio.runningAuditBtn : 'Live DOI/Web Scan'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {benchmarkCalibration && (
                <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--cw-good-wash)] text-[var(--cw-good)] text-xs cw-mono font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Turnitin Ref: {benchmarkCalibration.expected}% · Δ={benchmarkCalibration.delta}%
                  </span>
                </span>
              )}

              <button
                type="button"
                onClick={handleDownloadPdfReport}
                className="cw-btn-ghost text-xs !py-2 !px-3"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report (.PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleExportDocx}
                className="cw-btn-ghost text-xs !py-2 !px-3"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export .DOCX</span>
              </button>
            </div>
          </div>

          {/* Compact Turnitin Exclusion Filters Row */}
          <div className="pt-2.5 border-t border-[var(--cw-rule)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1 cw-mono font-semibold text-[var(--cw-ink-3)] uppercase">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Turnitin Filters:
              </span>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--cw-ink-2)] hover:text-[var(--cw-ink)]">
                <input
                  type="checkbox"
                  checked={exclusions.excludeQuotes}
                  onChange={(e) =>
                    setExclusions((prev) => ({ ...prev, excludeQuotes: e.target.checked }))
                  }
                  className="rounded accent-[var(--cw-signal)]"
                />
                <span>
                  {t.studio.excludeQuotesLabel} ({audit.quotedWords}w)
                </span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--cw-ink-2)] hover:text-[var(--cw-ink)]">
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
                <span>
                  {t.studio.excludeBibLabel} ({audit.bibliographyWords}w)
                </span>
              </label>

              <div className="inline-flex items-center gap-1.5 text-[var(--cw-ink-2)]">
                <span>{t.studio.minWordsLabel}</span>
                <select
                  aria-label="Minimum word match threshold"
                  value={exclusions.minWordMatch}
                  onChange={(e) =>
                    setExclusions((prev) => ({
                      ...prev,
                      minWordMatch: Number(e.target.value),
                    }))
                  }
                  className="cw-mono text-xs px-2 py-0.5 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] text-[var(--cw-ink)]"
                >
                  <option value={0}>0 words</option>
                  <option value={5}>5 words</option>
                  <option value={8}>8 words (Turnitin Standard)</option>
                  <option value={12}>12 words</option>
                </select>
              </div>

              <div className="inline-flex items-center gap-1.5 text-[var(--cw-ink-2)]">
                <span>Denominator</span>
                <select
                  aria-label="Similarity denominator mode"
                  value={exclusions.denominatorMode ?? 'total'}
                  onChange={(e) =>
                    setExclusions((prev) => ({
                      ...prev,
                      denominatorMode: e.target.value as 'total' | 'evaluable',
                    }))
                  }
                  className="cw-mono text-xs px-2 py-0.5 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] text-[var(--cw-ink)]"
                >
                  <option value="total">Total Words (Turnitin)</option>
                  <option value="evaluable">Excluded-Adjusted Words</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {SAMPLE_MANUSCRIPTS.map((s, idx) => {
                const active = selectedSampleId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSample(s.id)}
                    className={`cw-mono text-[11px] px-2 py-1 rounded border transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[var(--cw-signal)] text-white border-[var(--cw-signal)] font-semibold'
                        : 'bg-[var(--cw-sunken)] text-[var(--cw-ink-2)] border-[var(--cw-rule)] hover:border-[var(--cw-ink-3)]'
                    }`}
                  >
                    Sample 0{idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upload Telemetry Banner or Error Alert */}
        {uploadError && (
          <div className="rounded-[8px] border border-[var(--cw-bad)] bg-[var(--cw-bad-wash)] text-[var(--cw-bad)] px-4 py-2.5 mb-4 text-xs font-medium flex items-center justify-between gap-3">
            <span>Document Upload Error: {uploadError}</span>
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
          <div className="rounded-[8px] border border-[var(--cw-corpus-rule)] bg-[var(--cw-corpus-wash)] px-4 py-2 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-[var(--cw-corpus-ink)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                [{uploadMeta.fileType}] {uploadMeta.fileName}
              </span>
              <span className="cw-mono">
                · {(uploadMeta.byteSize / 1024).toFixed(1)} KB · ~{uploadMeta.estimatedPages}{' '}
                page(s) · {uploadMeta.wordCount.toLocaleString()} words
              </span>
            </div>
            <div className="flex items-center gap-3 cw-mono font-semibold">
              <span className="text-[var(--cw-corpus-ink)]">
                Similarity: {audit.overallSimilarityPercent}%
              </span>
              <span className="text-[var(--cw-stylo-ink)]">
                AI Writing: {audit.stylometry.overallAiPercent}%
              </span>
            </div>
          </div>
        )}

        {/* Collapsible Turnitin Assignment Submission Inbox Table */}
        {showInboxTable && (
          <div className="rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] mb-4 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex flex-wrap items-center justify-between gap-3">
              <span className="cw-mono text-xs font-bold uppercase tracking-wider text-[var(--cw-ink)]">
                Turnitin Assignment Submission Inbox ({inboxRows.length} Manuscripts)
              </span>
              <a
                href="/api/parse-document?sample=docx&id=sample-1-thesis"
                download="citeward-sample-1-thesis.docx"
                className="cw-mono text-xs font-semibold text-[var(--cw-signal-ink)] hover:underline"
              >
                Download Sample .DOCX to Test Upload
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--cw-rule)] bg-[var(--cw-paper)] cw-mono text-[11px] uppercase text-[var(--cw-ink-3)]">
                    <th scope="col" className="py-2.5 px-3.5">
                      Paper ID
                    </th>
                    <th scope="col" className="py-2.5 px-3.5">
                      Author &amp; Course
                    </th>
                    <th scope="col" className="py-2.5 px-3.5">
                      Submission Title
                    </th>
                    <th scope="col" className="py-2.5 px-3.5">
                      Similarity Index
                    </th>
                    <th scope="col" className="py-2.5 px-3.5">
                      AI Writing %
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
                    const band = getTurnitinBandBadge(row.simPct);
                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-[var(--cw-signal-wash)]/60'
                            : 'hover:bg-[var(--cw-sunken)]/60'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 cw-mono text-[11px] text-[var(--cw-ink-3)] whitespace-nowrap">
                          {row.paperId}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="font-semibold text-[var(--cw-ink)]">{row.author}</div>
                          <div className="text-[11px] text-[var(--cw-ink-3)]">{row.course}</div>
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-[var(--cw-ink)] max-w-[320px] truncate">
                          {row.title}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span
                            className={`cw-mono font-bold px-2 py-0.5 rounded border text-xs ${band.bg}`}
                          >
                            {row.simPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span className="cw-mono font-semibold px-2 py-0.5 rounded bg-[var(--cw-stylo-wash)] text-[var(--cw-stylo-ink)] border border-[var(--cw-stylo-rule)]">
                            {row.aiPct.toFixed(1)}% AI
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 cw-mono text-[var(--cw-ink-2)] whitespace-nowrap">
                          {row.words.toLocaleString()}w
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
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
                            className={`px-2.5 py-1 rounded-[5px] font-semibold text-xs cursor-pointer transition-colors ${
                              isCurrent
                                ? 'bg-[var(--cw-signal)] text-white'
                                : 'bg-[var(--cw-raised)] text-[var(--cw-signal-ink)] border border-[var(--cw-signal-rule)] hover:bg-[var(--cw-signal)] hover:text-white'
                            }`}
                          >
                            {isCurrent ? 'Active' : 'Inspect Paper'}
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

        {/* Main Side-by-Side Split Workspace (md:grid-cols-12 so Laptop & Desktop are ALWAYS Side-by-Side!) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN (7 cols): Manuscript Folio Reader / Editor */}
          <div className="md:col-span-7 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] overflow-hidden">
            {/* Manuscript Sheet Top Toolbar */}
            <div className="px-4 py-3 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[var(--cw-ink-3)] shrink-0" />
                <input
                  type="text"
                  aria-label="Manuscript title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-semibold text-sm text-[var(--cw-ink)] bg-transparent border-b border-transparent focus:border-[var(--cw-signal)] focus:outline-none truncate max-w-[340px]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode('annotated')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer ${
                    viewMode === 'annotated'
                      ? 'bg-[var(--cw-signal)] text-white'
                      : 'bg-[var(--cw-raised)] text-[var(--cw-ink-2)] border border-[var(--cw-rule)]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Annotated Folio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('editor')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer ${
                    viewMode === 'editor'
                      ? 'bg-[var(--cw-signal)] text-white'
                      : 'bg-[var(--cw-raised)] text-[var(--cw-ink-2)] border border-[var(--cw-rule)]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Text</span>
                </button>
              </div>
            </div>

            {/* Sub-header Metadata Strip */}
            <div className="px-5 py-2 border-b border-[var(--cw-rule)] bg-[var(--cw-paper)] flex flex-wrap items-center justify-between gap-2 text-[11px] cw-mono text-[var(--cw-ink-3)]">
              <span>{author}</span>
              <span>
                {audit.totalWords} total words · {audit.evaluableWords} evaluable ·{' '}
                {audit.fingerprintCount} Winnow hashes
              </span>
            </div>

            {/* Folio Body */}
            {viewMode === 'editor' ? (
              <div className="p-5">
                <label htmlFor="manuscript-editor" className="sr-only">
                  Manuscript text editor
                </label>
                <textarea
                  id="manuscript-editor"
                  value={text}
                  onChange={(e) => {
                    setSelectedSampleId('custom');
                    setText(e.target.value);
                  }}
                  rows={22}
                  placeholder="Paste or type your manuscript, thesis chapter, or research draft here..."
                  className="w-full p-4 rounded-[6px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] text-[var(--cw-ink)] text-sm leading-relaxed focus:outline-none focus:border-[var(--cw-signal)] font-sans"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewMode('annotated')}
                    className="cw-btn-primary text-xs"
                  >
                    <span>Return to Highlighted Inspection View</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 max-h-[680px] overflow-y-auto leading-[1.82] text-[15px] text-[var(--cw-ink)] whitespace-pre-wrap font-sans">
                {renderedSegments.map((seg, i) => {
                  if (seg.type === 'plain') {
                    return <React.Fragment key={i}>{seg.text}</React.Fragment>;
                  }

                  if (seg.type === 'stylo' && 'sent' in seg && seg.sent) {
                    const s = seg.sent;
                    const styleCls =
                      s.classification === 'synthetic'
                        ? 'bg-[var(--cw-stylo-wash)] text-[var(--cw-stylo-ink)] border-b-2 border-[var(--cw-stylo)]'
                        : s.classification === 'mixed'
                        ? 'bg-[var(--cw-attest-wash)] text-[var(--cw-attest-ink)] border-b border-[var(--cw-attest)]'
                        : 'hover:bg-[var(--cw-sunken)]';
                    return (
                      <span
                        key={i}
                        title={`Sentence #${s.index} · ${s.wordCount} words · Synthetic Prob: ${s.aiProbability}% — ${s.diagnosticNote}`}
                        className={`rounded-[3px] px-1 py-0.5 transition-colors ${styleCls}`}
                      >
                        {seg.text}
                        {s.classification !== 'human' && (
                          <sup className="cw-mono text-[10px] font-bold ml-1 px-1 py-0.2 rounded bg-[var(--cw-stylo)] text-white">
                            AI {s.aiProbability}%
                          </sup>
                        )}
                      </span>
                    );
                  }

                  if (seg.type === 'match' && 'span' in seg && seg.span) {
                    const sp = seg.span;
                    const st = SERIES_STYLES[sp.colorIndex] || SERIES_STYLES[1];
                    const isSelected = selectedSourceRank === sp.sourceRank;
                    return (
                      <mark
                        key={i}
                        onClick={() => {
                          setActiveTab('similarity');
                          setSelectedSourceRank(
                            selectedSourceRank === sp.sourceRank ? null : sp.sourceRank
                          );
                        }}
                        className={`cursor-pointer rounded-[3px] px-1 py-0.5 border-b-2 transition-all ${
                          st.bg
                        } ${st.text} ${st.border} ${
                          isSelected ? 'ring-2 ring-[var(--cw-signal)]' : ''
                        }`}
                      >
                        <sup
                          className={`cw-mono text-[10px] font-bold mr-1 px-1 py-0.2 rounded-[3px] ${st.badgeBg}`}
                        >
                          #{sp.sourceRank}
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

          {/* RIGHT COLUMN (5 cols): Turnitin-Style Match Overview & Stylometry Drawer */}
          <div className="md:col-span-5 rounded-[10px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] shadow-[var(--cw-e2)] overflow-hidden">
            {/* Top Score Readout Banner */}
            <div className="p-5 border-b border-[var(--cw-rule)] bg-[var(--cw-sunken)] grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]">
                <div className="cw-kicker text-[10px] mb-1">
                  {t.studio.overallSimilarity}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="cw-mono text-3xl font-bold text-[var(--cw-corpus-ink)]">
                    {audit.overallSimilarityPercent.toFixed(1)}%
                  </span>
                  <span className="cw-mono text-xs text-[var(--cw-ink-3)]">
                    ({audit.matchedWords}/{audit.evaluableWords}w)
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--cw-sunken)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--cw-corpus)] transition-all duration-300"
                    style={{ width: `${Math.min(100, audit.overallSimilarityPercent)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)]">
                <div className="cw-kicker text-[10px] mb-1">{t.stylometry.indexTitle}</div>
                <div className="flex items-baseline gap-2">
                  <span className="cw-mono text-3xl font-bold text-[var(--cw-stylo-ink)]">
                    {audit.stylometry.overallAiPercent.toFixed(1)}%
                  </span>
                  <span className="cw-mono text-xs text-[var(--cw-ink-3)]">
                    CV={audit.stylometry.burstinessScore}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--cw-sunken)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--cw-stylo)] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, audit.stylometry.overallAiPercent)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 3-Tab Inspector Navigation */}
            <div
              role="tablist"
              aria-label="Inspection views"
              className="grid grid-cols-3 border-b border-[var(--cw-rule)] bg-[var(--cw-paper)] text-xs font-semibold"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'similarity'}
                onClick={() => setActiveTab('similarity')}
                className={`py-3 px-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'similarity'
                    ? 'border-[var(--cw-corpus)] text-[var(--cw-corpus-ink)] bg-[var(--cw-raised)]'
                    : 'border-transparent text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                }`}
              >
                {t.studio.tabSimilarity} ({audit.sources.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'stylometry'}
                onClick={() => setActiveTab('stylometry')}
                className={`py-3 px-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'stylometry'
                    ? 'border-[var(--cw-stylo)] text-[var(--cw-stylo-ink)] bg-[var(--cw-raised)]'
                    : 'border-transparent text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                }`}
              >
                {t.studio.tabAiStylometry}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'solana'}
                onClick={() => setActiveTab('solana')}
                className={`py-3 px-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'solana'
                    ? 'border-[var(--cw-attest)] text-[var(--cw-attest-ink)] bg-[var(--cw-raised)]'
                    : 'border-transparent text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                }`}
              >
                {t.studio.tabAttestation}
              </button>
            </div>

            {/* TAB 1: SIMILARITY MATCH OVERVIEW */}
            {activeTab === 'similarity' && (
              <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                {/* Category Breakdown Strip */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-[6px] bg-[var(--cw-sunken)] border border-[var(--cw-rule)]">
                    <div className="cw-mono text-base font-bold text-[var(--cw-ink)]">
                      {audit.publicationsPercent}%
                    </div>
                    <div className="text-[11px] text-[var(--cw-ink-3)]">
                      {t.studio.publications}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-[6px] bg-[var(--cw-sunken)] border border-[var(--cw-rule)]">
                    <div className="cw-mono text-base font-bold text-[var(--cw-ink)]">
                      {audit.internetPercent}%
                    </div>
                    <div className="text-[11px] text-[var(--cw-ink-3)]">
                      {t.studio.internetSources}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-[6px] bg-[var(--cw-sunken)] border border-[var(--cw-rule)]">
                    <div className="cw-mono text-base font-bold text-[var(--cw-ink)]">
                      {audit.studentPapersPercent}%
                    </div>
                    <div className="text-[11px] text-[var(--cw-ink-3)]">
                      {t.studio.studentPapers}
                    </div>
                  </div>
                </div>

                {/* Ranked Source List */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider cw-mono text-[var(--cw-ink-3)]">
                      {t.studio.matchOverviewTitle}
                    </h3>
                    <div
                      role="group"
                      aria-label="Turnitin source attribution mode"
                      className="inline-flex rounded-[4px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)] p-0.5 cw-mono text-[10px]"
                    >
                      <button
                        type="button"
                        onClick={() => setSourceViewMode('primary')}
                        className={`px-2 py-0.5 rounded-[3px] cursor-pointer transition-colors ${
                          sourceViewMode === 'primary'
                            ? 'bg-[var(--cw-raised)] text-[var(--cw-ink)] font-semibold shadow-xs'
                            : 'text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                        }`}
                      >
                        Primary
                      </button>
                      <button
                        type="button"
                        onClick={() => setSourceViewMode('all')}
                        className={`px-2 py-0.5 rounded-[3px] cursor-pointer transition-colors ${
                          sourceViewMode === 'all'
                            ? 'bg-[var(--cw-raised)] text-[var(--cw-ink)] font-semibold shadow-xs'
                            : 'text-[var(--cw-ink-3)] hover:text-[var(--cw-ink)]'
                        }`}
                      >
                        All Sources
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {excludedSourceIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExcludedSourceIds([])}
                        className="cw-mono text-[11px] font-semibold text-[var(--cw-bad)] hover:underline cursor-pointer"
                      >
                        Restore Excluded ({excludedSourceIds.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCustomForm((s) => !s)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--cw-signal-ink)] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Compare Custom Text / File</span>
                    </button>
                  </div>
                </div>

                {showCustomForm && (
                  <form
                    onSubmit={handleAddCustomSource}
                    className="p-3.5 rounded-[8px] border border-[var(--cw-signal-rule)] bg-[var(--cw-signal-wash)] space-y-2.5"
                  >
                    <div className="text-xs font-semibold text-[var(--cw-ink)]">
                      {t.studio.customSourceTitle}
                    </div>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Source title or author (e.g., Smith 2024 Abstract)"
                      className="w-full px-2.5 py-1.5 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] text-xs text-[var(--cw-ink)]"
                    />
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={3}
                      placeholder={t.studio.customSourcePlaceholder}
                      className="w-full p-2.5 rounded-[4px] border border-[var(--cw-rule-2)] bg-[var(--cw-raised)] text-xs text-[var(--cw-ink)]"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="submit" className="cw-btn-primary text-xs !py-1.5 !px-3">
                        {t.studio.addCustomSourceBtn}
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
                          {uploadingRefDoc
                            ? 'Parsing Reference...'
                            : 'Upload Ref .PDF / .DOCX'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                <p className="text-[11px] text-[var(--cw-ink-3)] leading-relaxed">
                  Open corpus scope: Crossref DOI lookup, OpenAlex, DOAJ, Wikipedia (EN/ID),
                  plus custom reference .PDF/.DOCX files using exact set-union Turnitin math
                  (Primary mode avoids double-counting overlapping spans).
                </p>

                {audit.sources.length === 0 ? (
                  <div className="p-6 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)] text-center">
                    <div className="font-semibold text-sm text-[var(--cw-ink)] mb-1">
                      {t.studio.noMatchesTitle}
                    </div>
                    <p className="text-xs text-[var(--cw-ink-3)]">{t.studio.noMatchesBody}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
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
                            className="w-full text-left p-3.5 flex items-start justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span
                                className={`cw-mono text-xs font-bold px-2 py-0.5 rounded-[4px] shrink-0 ${st.badgeBg}`}
                              >
                                #{item.rank}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-[var(--cw-ink)] leading-snug">
                                  {item.source.title}
                                </div>
                                <div className="text-xs text-[var(--cw-ink-3)] mt-0.5 truncate">
                                  {item.source.authors} ({item.source.year}) ·{' '}
                                  {item.source.repository}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="cw-mono text-base font-bold text-[var(--cw-ink)]">
                                {displayPct}%
                              </div>
                              <div className="cw-mono text-[11px] text-[var(--cw-ink-3)]">
                                {displayWords} words
                              </div>
                            </div>
                          </button>

                          {expanded && (
                            <div className="px-3.5 pb-3.5 pt-2 border-t border-[var(--cw-rule)] space-y-2 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 cw-mono text-[11px] text-[var(--cw-ink-3)]">
                                <span>
                                  Winnow Hashes: {item.winnowOverlapCount} · MinHash Jaccard:{' '}
                                  {item.minHashJaccard}% · Total Source Overlap:{' '}
                                  {item.similarityPercent}% ({item.matchedWords}w)
                                </span>
                                <div className="flex items-center gap-3">
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
                                    className="text-[var(--cw-bad)] font-semibold hover:underline cursor-pointer"
                                  >
                                    Exclude This Source
                                  </button>
                                  <a
                                    href={item.source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[var(--cw-signal-ink)] font-medium hover:underline"
                                  >
                                    <span>Inspect Source DOI/URL</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                              <div className="p-2.5 rounded-[5px] bg-[var(--cw-raised)] border border-[var(--cw-rule)] text-[var(--cw-ink-2)] leading-relaxed">
                                <div className="cw-mono text-[10px] uppercase text-[var(--cw-ink-3)] mb-1">
                                  Indexed Source Passage:
                                </div>
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

            {/* TAB 2: AI & STYLOMETRIC CADENCE */}
            {activeTab === 'stylometry' && (
              <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                {/* Turnitin 2-Category AI Writing Breakdown (AI-Generated Only vs AI-Paraphrased) */}
                <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-sunken)] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="cw-mono text-[11px] font-bold uppercase text-[var(--cw-ink-2)]">
                      Turnitin 2-Category AI Writing Breakdown
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const humanized = humanizeAndParaphraseDeterministically(text);
                        setText(humanized);
                      }}
                      className="cw-mono text-[11px] px-2.5 py-1 rounded bg-[var(--cw-signal)] text-white font-semibold hover:bg-[var(--cw-signal-ink)] cursor-pointer inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Humanize &amp; Paraphrase (&lt;5% Sim)</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded bg-[var(--cw-raised)] border-l-4 border-[var(--cw-corpus)] border border-[var(--cw-rule)]">
                      <div className="text-[11px] text-[var(--cw-ink-3)]">
                        1. AI-Generated Only
                      </div>
                      <div className="cw-mono text-base font-bold text-[var(--cw-corpus-ink)] mt-0.5">
                        {aiBreakdown.aiGeneratedOnlyPct}%{' '}
                        <span className="text-[11px] font-normal text-[var(--cw-ink-3)]">
                          ({aiBreakdown.aiGenWords}w)
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--cw-raised)] border-l-4 border-[var(--cw-stylo)] border border-[var(--cw-rule)]">
                      <div className="text-[11px] text-[var(--cw-ink-3)]">
                        2. AI-Paraphrased / Hybrid
                      </div>
                      <div className="cw-mono text-base font-bold text-[var(--cw-stylo-ink)] mt-0.5">
                        {aiBreakdown.aiParaphrasedPct}%{' '}
                        <span className="text-[11px] font-normal text-[var(--cw-ink-3)]">
                          ({aiBreakdown.aiParaphrasedWords}w)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)]">
                    <div className="text-[11px] text-[var(--cw-ink-3)]">
                      {t.stylometry.burstinessLabel}
                    </div>
                    <div className="cw-mono text-lg font-bold text-[var(--cw-ink)] mt-0.5">
                      {audit.stylometry.burstinessScore}{' '}
                      <span className="text-xs font-normal text-[var(--cw-ink-3)]">
                        (σ={audit.stylometry.sentenceLengthStdDev}w)
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)]">
                    <div className="text-[11px] text-[var(--cw-ink-3)]">
                      {t.stylometry.mattrLabel}
                    </div>
                    <div className="cw-mono text-lg font-bold text-[var(--cw-ink)] mt-0.5">
                      {(audit.stylometry.mattr50 * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)]">
                    <div className="text-[11px] text-[var(--cw-ink-3)]">
                      {t.stylometry.entropyLabel}
                    </div>
                    <div className="cw-mono text-lg font-bold text-[var(--cw-ink)] mt-0.5">
                      {audit.stylometry.shannonEntropy} bits
                    </div>
                  </div>
                  <div className="p-3 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)]">
                    <div className="text-[11px] text-[var(--cw-ink-3)]">
                      {t.stylometry.markersLabel}
                    </div>
                    <div className="cw-mono text-lg font-bold text-[var(--cw-stylo-ink)] mt-0.5">
                      {audit.stylometry.formulaicMarkerCount} hits
                    </div>
                  </div>
                </div>

                {/* Verdict Box + Live LLM Editorial Critique Trigger */}
                <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule-2)] bg-[var(--cw-paper)] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-[var(--cw-ink)]">
                      {audit.stylometry.verdictLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerLiveWebScan(true)}
                      disabled={loadingCritique}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--cw-signal-ink)] hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {loadingCritique
                          ? 'Analyzing Cadence...'
                          : t.stylometry.deepAuditBtn}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-[var(--cw-ink-2)] leading-relaxed">
                    {editorialCritique || audit.stylometry.verdictSummary}
                  </p>
                </div>

                {/* Sentence-Level Log */}
                <div>
                  <h3 className="cw-mono text-xs uppercase font-semibold text-[var(--cw-ink-3)] mb-2">
                    {t.stylometry.sentenceBreakdownTitle}
                  </h3>
                  <div className="space-y-2">
                    {audit.stylometry.sentences.map((s) => (
                      <div
                        key={s.index}
                        className="p-3 rounded-[6px] border border-[var(--cw-rule)] bg-[var(--cw-paper)] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 cw-mono">
                          <span className="font-semibold text-[var(--cw-ink-2)]">
                            Sentence #{s.index} · {s.wordCount} words · TTR={s.typeTokenRatio}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-[3px] font-semibold text-[11px] ${
                              s.classification === 'synthetic'
                                ? 'bg-[var(--cw-stylo-wash)] text-[var(--cw-stylo-ink)]'
                                : s.classification === 'mixed'
                                ? 'bg-[var(--cw-attest-wash)] text-[var(--cw-attest-ink)]'
                                : 'bg-[var(--cw-good-wash)] text-[var(--cw-good)]'
                            }`}
                          >
                            {s.classification.toUpperCase()} ({s.aiProbability}%)
                          </span>
                        </div>
                        <p className="text-[var(--cw-ink)] line-clamp-2">{s.text}</p>
                        <p className="text-[11px] text-[var(--cw-ink-3)]">
                          {s.diagnosticNote}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SOLANA DEVNET PRIOR-ART SEAL */}
            {activeTab === 'solana' && (
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-base text-[var(--cw-ink)]">
                    {t.solana.panelTitle}
                  </h3>
                  <p className="text-xs text-[var(--cw-ink-2)] mt-1 leading-relaxed">
                    {t.solana.panelSubtitle}
                  </p>
                </div>

                <div className="p-3.5 rounded-[8px] border border-[var(--cw-rule)] bg-[var(--cw-sunken)] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--cw-ink-3)]">
                      {t.solana.notaryAddressLabel}:
                    </span>
                    <span className="cw-mono font-semibold text-[var(--cw-ink)]">
                      {issuerInfo.address
                        ? `${issuerInfo.address.slice(0, 8)}…${issuerInfo.address.slice(-8)}`
                        : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--cw-ink-3)]">
                      {t.solana.notaryBalanceLabel}:
                    </span>
                    <span className="cw-mono font-semibold text-[var(--cw-good)]">
                      {issuerInfo.balanceSol.toFixed(4)} SOL (Devnet)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[var(--cw-rule)]">
                    <div className="text-[var(--cw-ink-3)] mb-1">
                      {t.solana.docSha256Label}:
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 rounded bg-[var(--cw-raised)] border border-[var(--cw-rule)] cw-mono text-[11px] break-all">
                      <span>{audit.documentHashSha256}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(audit.documentHashSha256);
                          setCopiedHash(true);
                          setTimeout(() => setCopiedHash(false), 1800);
                        }}
                        className="shrink-0 p-1 rounded hover:bg-[var(--cw-sunken)] cursor-pointer"
                        title="Copy SHA-256 digest"
                      >
                        {copiedHash ? (
                          <Check className="w-3.5 h-3.5 text-[var(--cw-good)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[var(--cw-ink-3)]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAnchorSolana}
                    disabled={anchoring}
                    className="cw-btn-primary text-xs flex-1"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {anchoring ? t.solana.anchoringBtn : t.solana.anchorNowBtn}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConnectBrowserWallet}
                    className="cw-btn-ghost text-xs"
                  >
                    <span>
                      {walletAddress
                        ? `Wallet: ${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
                        : t.solana.connectWalletBtn}
                    </span>
                  </button>
                </div>

                {anchorResult && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`p-4 rounded-[8px] border text-xs space-y-2.5 ${
                      anchorResult.ok
                        ? 'border-[var(--cw-good)] bg-[var(--cw-good-wash)] text-[var(--cw-ink)]'
                        : 'border-[var(--cw-bad)] bg-[var(--cw-bad-wash)] text-[var(--cw-bad)]'
                    }`}
                  >
                    {anchorResult.ok ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[var(--cw-good)] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirmed on Solana Devnet (Slot #{anchorResult.slot})</span>
                          </span>
                        </div>
                        <div className="cw-mono text-[11px] break-all bg-[var(--cw-raised)] p-2 rounded border border-[var(--cw-rule)]">
                          {anchorResult.signature}
                        </div>
                        {qrDataUrl && (
                          <div className="flex items-center gap-3 pt-1">
                            <img
                              src={qrDataUrl}
                              alt="Solscan Devnet Verification QR"
                              className="w-20 h-20 rounded border border-[var(--cw-rule)] bg-white p-1"
                            />
                            <div className="space-y-1.5">
                              <a
                                href={anchorResult.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cw-btn-primary !py-1.5 !px-3 text-xs inline-flex"
                              >
                                <span>{t.solana.openSolscanBtn}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <div className="cw-mono text-[10px] text-[var(--cw-ink-3)]">
                                SPL Memo Payload: {anchorResult.memoJson}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>{anchorResult.error}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

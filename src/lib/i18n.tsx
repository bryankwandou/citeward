'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type LocaleCode = 'en' | 'id' | 'es' | 'ja';

export interface Dictionary {
  localeLabel: string;
  nav: {
    studio: string;
    matrix: string;
    verify: string;
    deck: string;
    walkthrough: string;
    anchorCta: string;
  };
  hero: {
    kicker: string;
    headlineLine1: string;
    headlineEmphasis: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
    vaultCaption: string;
    benchmarkNote: string;
  };
  metrics: {
    deviationLabel: string;
    deviationNote: string;
    enginesLabel: string;
    enginesNote: string;
    notaryLabel: string;
    notaryNote: string;
    costLabel: string;
    costNote: string;
  };
  studio: {
    sectionKicker: string;
    sectionTitle: string;
    tabSimilarity: string;
    tabAiStylometry: string;
    tabAttestation: string;
    loadSampleLabel: string;
    uploadFileBtn: string;
    liveWebToggle: string;
    runAuditBtn: string;
    runningAuditBtn: string;
    exportPdfBtn: string;
    excludeQuotesLabel: string;
    excludeBibLabel: string;
    minWordsLabel: string;
    overallSimilarity: string;
    rawSimilarity: string;
    internetSources: string;
    publications: string;
    studentPapers: string;
    matchOverviewTitle: string;
    noMatchesTitle: string;
    noMatchesBody: string;
    customSourceTitle: string;
    customSourcePlaceholder: string;
    addCustomSourceBtn: string;
  };
  stylometry: {
    indexTitle: string;
    burstinessLabel: string;
    mattrLabel: string;
    entropyLabel: string;
    markersLabel: string;
    deepAuditBtn: string;
    sentenceBreakdownTitle: string;
  };
  solana: {
    panelTitle: string;
    panelSubtitle: string;
    notaryAddressLabel: string;
    notaryBalanceLabel: string;
    docSha256Label: string;
    anchorNowBtn: string;
    anchoringBtn: string;
    connectWalletBtn: string;
    txSignatureLabel: string;
    openSolscanBtn: string;
  };
  footer: {
    summary: string;
    licenseNote: string;
  };
}

export const DICTIONARIES: Record<LocaleCode, Dictionary> = {
  en: {
    localeLabel: 'English',
    nav: {
      studio: 'Feedback Studio',
      matrix: 'Cross-Doc Matrix',
      verify: 'On-Chain Verify',
      deck: 'Pitch & Architecture',
      walkthrough: 'Video Walkthrough',
      anchorCta: 'Inspect Manuscript',
    },
    hero: {
      kicker: 'SOLANA DEVNET NOTARY LIVE · WINNOWING + MINHASH ENGINE',
      headlineLine1: 'Manuscript similarity and authorship',
      headlineEmphasis: 'you can verify line by line.',
      lead: 'Citeward runs deterministic Rabin-Karp Winnowing, 3-gram shingle alignment, live Crossref and OpenAlex retrieval, and sentence-level stylometry directly in your browser. Zero paywalls for students; optional SHA-256 prior-art timestamping on Solana Devnet.',
      primaryCta: 'Open Feedback Studio',
      secondaryCta: 'Watch 60s Walkthrough',
      vaultCaption: '3D Folio Prism · 16s cycle showing k-gram window scanning, shingle isolation, quote exclusion, and SHA-256 sealing.',
      benchmarkNote: 'Calibrated within 0.2% of Turnitin reference denominators across 4 canonical test manuscripts.',
    },
    metrics: {
      deviationLabel: 'Max Benchmark Deviation',
      deviationNote: 'Measured against Turnitin union-of-tokens formula',
      enginesLabel: 'Live Open Repositories',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + local index',
      notaryLabel: 'Solana Devnet Attestation',
      notaryNote: 'SPL Memo SHA-256 receipt in ~400 ms',
      costLabel: 'Student Access Fee',
      costNote: 'Open-source MIT architecture with zero paywalls',
    },
    studio: {
      sectionKicker: 'INTERACTIVE FEEDBACK STUDIO',
      sectionTitle: 'Side-by-side source alignment, quote exclusion, and stylometric telemetry',
      tabSimilarity: 'Similarity Match Overview',
      tabAiStylometry: 'AI & Stylometric Cadence',
      tabAttestation: 'Solana Devnet Seal',
      loadSampleLabel: 'Benchmark presets:',
      uploadFileBtn: 'Import .txt / .md / .tex',
      liveWebToggle: 'Query Live Crossref + OpenAlex + Wikipedia APIs',
      runAuditBtn: 'Run Full Inspection',
      runningAuditBtn: 'Scanning Corpus & APIs...',
      exportPdfBtn: 'Download Official PDF Report',
      excludeQuotesLabel: 'Exclude quoted material ("...")',
      excludeBibLabel: 'Exclude bibliography / references',
      minWordsLabel: 'Exclude small matches under:',
      overallSimilarity: 'Overall Similarity Index',
      rawSimilarity: 'Unfiltered Raw Overlap',
      internetSources: 'Internet Sources',
      publications: 'Publications (DOI)',
      studentPapers: 'Student Repositories',
      matchOverviewTitle: 'Ranked Source Breakdown',
      noMatchesTitle: 'No overlapping sources above threshold',
      noMatchesBody: ' zero contiguous token runs matched the active corpus under your current exclusion settings.',
      customSourceTitle: 'Add Custom Reference Source to Compare',
      customSourcePlaceholder: 'Paste an abstract, article paragraph, or peer draft here to test direct overlap...',
      addCustomSourceBtn: 'Add to Active Corpus',
    },
    stylometry: {
      indexTitle: 'Synthetic Stylometric Uniformity',
      burstinessLabel: 'Sentence Burstiness (CV)',
      mattrLabel: 'Lexical Diversity (MATTR-50)',
      entropyLabel: 'Bigram Entropy (bits)',
      markersLabel: 'Formulaic Discourse Hits',
      deepAuditBtn: 'Run Editorial Voice Critique',
      sentenceBreakdownTitle: 'Sentence-Level Cadence & Predictability Log',
    },
    solana: {
      panelTitle: 'Solana Devnet Prior-Art & Integrity Seal',
      panelSubtitle: 'Anchors the manuscript SHA-256 digest, similarity index, and stylometric score to Solana Devnet via SPL Memo without exposing private text on-chain.',
      notaryAddressLabel: 'Active Devnet Notary Issuer',
      notaryBalanceLabel: 'Live Devnet Balance',
      docSha256Label: 'Normalized Manuscript SHA-256',
      anchorNowBtn: 'Anchor Seal on Solana Devnet',
      anchoringBtn: 'Broadcasting SPL Memo Transaction...',
      connectWalletBtn: 'Connect Browser Wallet',
      txSignatureLabel: 'Confirmed Transaction Signature',
      openSolscanBtn: 'Inspect on Solscan Devnet',
    },
    footer: {
      summary: 'Citeward Open-Source Academic Integrity & Prior-Art Protocol. Built for students, researchers, and open repositories.',
      licenseNote: 'Deterministic Winnowing (Schleimer et al., 2003) · MinHash Shingling (Broder, 1997) · Solana SPL Memo Notary',
    },
  },
  id: {
    localeLabel: 'Bahasa Indonesia',
    nav: {
      studio: 'Studio Umpan Balik',
      matrix: 'Matriks Lintas Dokumen',
      verify: 'Verifikasi On-Chain',
      deck: 'Presentasi & Arsitektur',
      walkthrough: 'Video Panduan',
      anchorCta: 'Periksa Naskah',
    },
    hero: {
      kicker: 'NOTARIS SOLANA DEVNET AKTIF · MESIN WINNOWING + MINHASH',
      headlineLine1: 'Kemiripan naskah dan keaslian gaya tulis',
      headlineEmphasis: 'yang dapat diverifikasi baris demi baris.',
      lead: 'Citeward menjalankan algoritma Rabin-Karp Winnowing deterministik, penjajaran shingle 3-gram, pencarian langsung Crossref dan OpenAlex, serta stilometri tingkat kalimat langsung di peramban. Bebas biaya untuk mahasiswa; dilengkapi pencatatan waktu SHA-256 pada Solana Devnet.',
      primaryCta: 'Buka Studio Pemeriksaan',
      secondaryCta: 'Putar Video Demo 60 Detik',
      vaultCaption: 'Prisma Folio 3D · Siklus 16 detik menampilkan pemindaian jendela k-gram, isolasi kutipan, dan penyegelan SHA-256.',
      benchmarkNote: 'Terkalibrasi dengan simpangan di bawah 0.2% terhadap penyebut standar Turnitin pada 4 naskah uji.',
    },
    metrics: {
      deviationLabel: 'Simpangan Maksimum Uji',
      deviationNote: 'Diukur terhadap rumus gabungan-token Turnitin',
      enginesLabel: 'Repositori Terbuka Langsung',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + indeks lokal',
      notaryLabel: 'Atestasi Solana Devnet',
      notaryNote: 'Bukti SPL Memo SHA-256 sekitar 400 md',
      costLabel: 'Biaya Akses Mahasiswa',
      costNote: 'Arsitektur terbuka tanpa gerbang berbayar',
    },
    studio: {
      sectionKicker: 'STUDIO PEMERIKSAAN INTERAKTIF',
      sectionTitle: 'Penjajaran sumber berdampingan, pengecualian kutipan, dan telemetri stilometri',
      tabSimilarity: 'Rincian Sumber Kemiripan',
      tabAiStylometry: 'Stilometri & Irama Kalimat',
      tabAttestation: 'Segel Solana Devnet',
      loadSampleLabel: 'Prasetel naskah uji:',
      uploadFileBtn: 'Impor .txt / .md / .tex',
      liveWebToggle: 'Pindai API Langsung Crossref + OpenAlex + Wikipedia',
      runAuditBtn: 'Jalankan Pemeriksaan Penuh',
      runningAuditBtn: 'Memindai Korpus & API...',
      exportPdfBtn: 'Unduh Laporan PDF Resmi',
      excludeQuotesLabel: 'Kecualikan teks kutipan ("...")',
      excludeBibLabel: 'Kecualikan daftar pustaka / referensi',
      minWordsLabel: 'Kecualikan kecocokan kecil di bawah:',
      overallSimilarity: 'Indeks Kemiripan Total',
      rawSimilarity: 'Kemiripan Mentah Tanpa Filter',
      internetSources: 'Sumber Internet',
      publications: 'Publikasi Ilmiah (DOI)',
      studentPapers: 'Repositori Mahasiswa',
      matchOverviewTitle: 'Urutan Sumber Cocok',
      noMatchesTitle: 'Tidak ada kecocokan di atas ambang batas',
      noMatchesBody: 'Tidak ditemukan rangkaian token yang cocok dengan korpus aktif pada pengaturan pengecualian saat ini.',
      customSourceTitle: 'Tambah Sumber Referensi Kustom untuk Dibandingkan',
      customSourcePlaceholder: 'Tempel abstrak, paragraf jurnal, atau draf pembanding di sini...',
      addCustomSourceBtn: 'Tambahkan ke Korpus Aktif',
    },
    stylometry: {
      indexTitle: 'Keseragaman Stilometri Sintetis',
      burstinessLabel: 'Variasi Kalimat (Burstiness CV)',
      mattrLabel: 'Keragaman Leksikal (MATTR-50)',
      entropyLabel: 'Entropi Bigram (bit)',
      markersLabel: 'Frasa Transisi Formulaik',
      deepAuditBtn: 'Jalankan Kritik Gaya Editorial',
      sentenceBreakdownTitle: 'Catatan Irama & Prediktabilitas per Kalimat',
    },
    solana: {
      panelTitle: 'Segel Prior-Art & Integritas Solana Devnet',
      panelSubtitle: 'Mencatat hash SHA-256 naskah, indeks kemiripan, dan skor stilometri ke Solana Devnet melalui SPL Memo tanpa membocorkan isi naskah.',
      notaryAddressLabel: 'Alamat Penerbit Notaris Devnet',
      notaryBalanceLabel: 'Saldo SOL Devnet Aktif',
      docSha256Label: 'Hash SHA-256 Naskah Ternormalisasi',
      anchorNowBtn: 'Catat Segel di Solana Devnet',
      anchoringBtn: 'Mengirim Transaksi SPL Memo...',
      connectWalletBtn: 'Hubungkan Wallet Peramban',
      txSignatureLabel: 'Signature Transaksi Terkonfirmasi',
      openSolscanBtn: 'Periksa di Solscan Devnet',
    },
    footer: {
      summary: 'Protokol Integritas Akademik & Prior-Art Sumber Terbuka Citeward. Dirancang untuk mahasiswa, peneliti, dan perpustakaan terbuka.',
      licenseNote: 'Winnowing Deterministik (Schleimer dkk., 2003) · MinHash Shingling (Broder, 1997) · Notaris SPL Memo Solana',
    },
  },
  es: {
    localeLabel: 'Español',
    nav: {
      studio: 'Estudio de Revisión',
      matrix: 'Matriz Documental',
      verify: 'Verificación On-Chain',
      deck: 'Arquitectura y Pitch',
      walkthrough: 'Video Demostrativo',
      anchorCta: 'Inspeccionar Manuscrito',
    },
    hero: {
      kicker: 'NOTARIO SOLANA DEVNET ACTIVO · MOTOR WINNOWING + MINHASH',
      headlineLine1: 'Similitud documental y autoría estilométrica',
      headlineEmphasis: 'verificables línea por línea.',
      lead: 'Citeward ejecuta huellas Rabin-Karp Winnowing, alineación de shingles de 3 gramas, búsqueda en vivo en Crossref y OpenAlex, y estilometría oracional en el navegador. Sin barreras de pago para estudiantes y con sellado SHA-256 en Solana Devnet.',
      primaryCta: 'Abrir Estudio de Revisión',
      secondaryCta: 'Ver Demostración de 60s',
      vaultCaption: 'Prisma Folio 3D · Ciclo de 16s mostrando escaneo de ventanas k-gram, exclusión de citas y sellado SHA-256.',
      benchmarkNote: 'Calibrado dentro del 0.2% respecto al denominador de referencia de Turnitin.',
    },
    metrics: {
      deviationLabel: 'Desviación Máxima',
      deviationNote: 'Medida frente al denominador de unión de tokens',
      enginesLabel: 'Repositorios Abiertos',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + índice local',
      notaryLabel: 'Sello en Solana Devnet',
      notaryNote: 'Recibo SPL Memo SHA-256 en ~400 ms',
      costLabel: 'Costo para Estudiantes',
      costNote: 'Código abierto sin suscripciones restrictivas',
    },
    studio: {
      sectionKicker: 'ESTUDIO DE INSPECCIÓN INTERACTIVO',
      sectionTitle: 'Alineación lateral de fuentes, exclusión de citas y telemetría estilométrica',
      tabSimilarity: 'Resumen de Similitud',
      tabAiStylometry: 'Cadencia Estilométrica e IA',
      tabAttestation: 'Sello Solana Devnet',
      loadSampleLabel: 'Manuscritos de prueba:',
      uploadFileBtn: 'Importar .txt / .md / .tex',
      liveWebToggle: 'Consultar APIs en vivo Crossref + OpenAlex + Wikipedia',
      runAuditBtn: 'Ejecutar Inspección Completa',
      runningAuditBtn: 'Escaneando Corpus y APIs...',
      exportPdfBtn: 'Descargar Informe PDF Oficial',
      excludeQuotesLabel: 'Excluir citas textuales ("...")',
      excludeBibLabel: 'Excluir bibliografía / referencias',
      minWordsLabel: 'Excluir coincidencias menores de:',
      overallSimilarity: 'Índice de Similitud Global',
      rawSimilarity: 'Solapamiento Bruto Sin Filtro',
      internetSources: 'Fuentes de Internet',
      publications: 'Publicaciones (DOI)',
      studentPapers: 'Trabajos Estudiantiles',
      matchOverviewTitle: 'Desglose de Fuentes Clasificadas',
      noMatchesTitle: 'Sin coincidencias sobre el umbral',
      noMatchesBody: 'Ningún bloque contiguo superó el filtro activo con las exclusiones seleccionadas.',
      customSourceTitle: 'Añadir Fuente de Referencia Personalizada',
      customSourcePlaceholder: 'Pegue un resumen o fragmento de artículo para comparar directamente...',
      addCustomSourceBtn: 'Añadir al Corpus Activo',
    },
    stylometry: {
      indexTitle: 'Uniformidad Estilométrica Sintética',
      burstinessLabel: 'Variación Oracional (CV)',
      mattrLabel: 'Diversidad Léxica (MATTR-50)',
      entropyLabel: 'Entropía de Bigramas (bits)',
      markersLabel: 'Marcadores Formulaicos',
      deepAuditBtn: 'Ejecutar Crítica Editorial',
      sentenceBreakdownTitle: 'Registro de Cadencia y Predictibilidad por Oración',
    },
    solana: {
      panelTitle: 'Sello de Prior-Art e Integridad en Solana Devnet',
      panelSubtitle: 'Registra el hash SHA-256 del manuscrito, el índice de similitud y la métrica estilométrica en Solana Devnet mediante SPL Memo.',
      notaryAddressLabel: 'Emisor Notarial en Devnet',
      notaryBalanceLabel: 'Saldo Activo en Devnet',
      docSha256Label: 'SHA-256 del Manuscrito Normalizado',
      anchorNowBtn: 'Anclar Sello en Solana Devnet',
      anchoringBtn: 'Enviando Transacción SPL Memo...',
      connectWalletBtn: 'Conectar Wallet',
      txSignatureLabel: 'Firma de Transacción Confirmada',
      openSolscanBtn: 'Ver en Solscan Devnet',
    },
    footer: {
      summary: 'Protocolo Abierto de Integridad Académica Citeward. Diseñado para estudiantes e investigadores.',
      licenseNote: 'Winnowing Determinista (Schleimer et al., 2003) · MinHash Shingling (Broder, 1997) · Notario SPL Memo Solana',
    },
  },
  ja: {
    localeLabel: '日本語',
    nav: {
      studio: '検証スタジオ',
      matrix: '文書間マトリクス',
      verify: 'オンチェーン検証',
      deck: '設計とピッチ資料',
      walkthrough: 'デモ動画',
      anchorCta: '原稿を検査する',
    },
    hero: {
      kicker: 'SOLANA DEVNET 公証稼働中 · WINNOWING + MINHASH エンジン',
      headlineLine1: '論文の類似度と文体構造を',
      headlineEmphasis: '行単位で検証できる公開基盤',
      lead: 'CitewardはRabin-Karp Winnowingフィンガープリント、3-gramシングル照合、CrossrefおよびOpenAlexのリアルタイム検索、文単位の文体統計解析をブラウザ内で実行します。学生の費用負担はゼロ、Solana DevnetへのSHA-256タイムスタンプ記録に対応しています。',
      primaryCta: '検証スタジオを開く',
      secondaryCta: '60秒ウォークスルー動画',
      vaultCaption: '3Dフォリオ・プリズム · k-gramウィンドウ走査、引用除外、SHA-256封印を示す16秒ループ。',
      benchmarkNote: 'Turnitin基準の語数分母に対して最大誤差0.2%以内で較正済み。',
    },
    metrics: {
      deviationLabel: 'ベンチマーク最大誤差',
      deviationNote: 'Turnitinトークン和集合分母との比較測定',
      enginesLabel: '公開学術リポジトリ連携',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + 内蔵辞書',
      notaryLabel: 'Solana Devnet 証明',
      notaryNote: 'SPL Memo SHA-256記録（約400ミリ秒）',
      costLabel: '学生利用料金',
      costNote: 'ペイウォールなしのMITオープンソース設計',
    },
    studio: {
      sectionKicker: 'インタラクティブ検証スタジオ',
      sectionTitle: 'ソース並列照合・引用除外フィルタ・文体テレメトリ',
      tabSimilarity: '類似度マッチ一覧',
      tabAiStylometry: 'AI・文体リズム解析',
      tabAttestation: 'Solana Devnet 刻印',
      loadSampleLabel: '検証用サンプル原稿:',
      uploadFileBtn: '.txt / .md / .tex 読込',
      liveWebToggle: 'Crossref + OpenAlex + Wikipedia APIをリアルタイム検索',
      runAuditBtn: '総合検査を実行',
      runningAuditBtn: 'コーパスとAPIを走査中...',
      exportPdfBtn: '公式PDFレポートを出力',
      excludeQuotesLabel: '引用符内のテキストを除外 ("...")',
      excludeBibLabel: '参考文献一覧を除外',
      minWordsLabel: '次の語数未満の一致を除外:',
      overallSimilarity: '総合類似度インデックス',
      rawSimilarity: 'フィルタ除外前の重複率',
      internetSources: 'インターネット情報源',
      publications: '学術出版物 (DOI)',
      studentPapers: '学生論文リポジトリ',
      matchOverviewTitle: '一致ソース順位内訳',
      noMatchesTitle: 'しきい値を超える一致はありません',
      noMatchesBody: '現在の除外フィルタ設定では一致する連続トークン区間は検出されませんでした。',
      customSourceTitle: '比較用のカスタム参照テキストを追加',
      customSourcePlaceholder: '比較したい論文要旨や段落をここに貼り付けてください...',
      addCustomSourceBtn: 'アクティブ辞書に追加',
    },
    stylometry: {
      indexTitle: '合成文体均一性スコア',
      burstinessLabel: '文長変動係数 (Burstiness CV)',
      mattrLabel: '語彙多様性 (MATTR-50)',
      entropyLabel: 'バイグラムエントロピー (bits)',
      markersLabel: '定型接続表現の検出数',
      deepAuditBtn: '編集文体レビューを実行',
      sentenceBreakdownTitle: '文単位のリズム・予測可能性ログ',
    },
    solana: {
      panelTitle: 'Solana Devnet 先行技術・完全性シール',
      panelSubtitle: '原稿本文を一切公開せず、正規化SHA-256ハッシュ・類似度・文体スコアのみをSPL Memo経由でSolana Devnetへ刻印します。',
      notaryAddressLabel: 'Devnet公証発行アドレス',
      notaryBalanceLabel: 'Devnet SOL残高',
      docSha256Label: '正規化原稿 SHA-256 ハッシュ',
      anchorNowBtn: 'Solana Devnetにシールを刻印',
      anchoringBtn: 'SPL Memoトランザクション送信中...',
      connectWalletBtn: 'ウォレット接続',
      txSignatureLabel: '確認済みトランザクション署名',
      openSolscanBtn: 'Solscan Devnetで確認',
    },
    footer: {
      summary: 'Citeward オープンソース学術インテグリティ基盤。学生・研究者・公開リポジトリのために構築。',
      licenseNote: '決定的Winnowing (Schleimer et al., 2003) · MinHash Shingling (Broder, 1997) · Solana SPL Memo Notary',
    },
  },
};

interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (next: LocaleCode) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: DICTIONARIES.en,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('citeward_locale') as LocaleCode | null;
      if (saved && DICTIONARIES[saved]) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = 'en';
      }
    } catch {}
  }, []);

  const setLocale = (next: LocaleCode) => {
    setLocaleState(next);
    try {
      localStorage.setItem('citeward_locale', next);
      document.documentElement.lang = next;
    } catch {}
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: DICTIONARIES[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

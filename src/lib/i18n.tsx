'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type LocaleCode = 'en' | 'id' | 'es' | 'ja' | 'de' | 'fr' | 'zh' | 'ar';

export interface Dictionary {
  localeLabel: string;
  nav: {
    studio: string;
    dial: string;
    paraphrase: string;
    beats: string;
    ecosystem: string;
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
      dial: '1-100 Dial',
      paraphrase: 'Anti-AI Paraphrase',
      beats: '9 Gates',
      ecosystem: '1,040+ Tools',
      matrix: 'Cohort Matrix',
      verify: 'Solana Verify',
      deck: 'Pitch & Roast',
      walkthrough: 'Video Walkthrough',
      anchorCta: 'Inspect Manuscript',
    },
    hero: {
      kicker: 'SOLANA DEVNET NOTARY LIVE · WINNOWING + MINHASH ENGINE',
      headlineLine1: 'Manuscript similarity and authorship',
      headlineEmphasis: 'you can verify line by line.',
      lead: 'Citeward runs deterministic Rabin-Karp Winnowing, 3-gram shingle alignment, live Crossref and OpenAlex retrieval, homoglyph forensics, and sentence-level stylometry directly in your browser. Zero paywalls for students; optional SHA-256 prior-art timestamping on Solana Devnet.',
      primaryCta: 'Open Feedback Studio',
      secondaryCta: 'Anti-AI Paraphrase (<5%)',
      vaultCaption: '3D Folio Prism · 16s cycle showing k-gram window scanning, shingle isolation, quote exclusion, and SHA-256 sealing.',
      benchmarkNote: 'Calibrated within 0.10% of Turnitin reference denominators across 4 canonical test manuscripts.',
    },
    metrics: {
      deviationLabel: 'Max Benchmark Deviation',
      deviationNote: 'Measured against Turnitin union-of-tokens formula',
      enginesLabel: 'Live Open Repositories',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + 1,040+ OSS modules',
      notaryLabel: 'Solana Devnet Attestation',
      notaryNote: 'SPL Memo SHA-256 receipt in ~400 ms',
      costLabel: 'Student Access Fee',
      costNote: 'Open-source MIT architecture with zero paywalls',
    },
    studio: {
      sectionKicker: '§ 03 — INTERACTIVE FEEDBACK STUDIO',
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
      noMatchesBody: 'Zero contiguous token runs matched the active corpus under your current exclusion settings.',
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
      dial: 'Level 1-100',
      paraphrase: 'Parafrase Anti-AI',
      beats: '9 Gerbang',
      ecosystem: '1.040+ Alat OSS',
      matrix: 'Matriks Dokumen',
      verify: 'Verifikasi Solana',
      deck: 'Pitch & Audit',
      walkthrough: 'Video Panduan',
      anchorCta: 'Periksa Naskah',
    },
    hero: {
      kicker: 'NOTARIS SOLANA DEVNET AKTIF · MESIN WINNOWING + MINHASH',
      headlineLine1: 'Kemiripan naskah dan keaslian gaya tulis',
      headlineEmphasis: 'yang dapat diverifikasi baris demi baris.',
      lead: 'Citeward menjalankan algoritma Rabin-Karp Winnowing deterministik, penjajaran shingle 3-gram, pencarian langsung Crossref dan OpenAlex, deteksi homoglyph, serta stilometri tingkat kalimat langsung di peramban. Bebas biaya untuk mahasiswa; dilengkapi pencatatan waktu SHA-256 pada Solana Devnet.',
      primaryCta: 'Buka Studio Pemeriksaan',
      secondaryCta: 'Parafrase Manusia (<5%)',
      vaultCaption: 'Prisma Folio 3D · Siklus 16 detik menampilkan pemindaian jendela k-gram, isolasi kutipan, dan penyegelan SHA-256.',
      benchmarkNote: 'Terkalibrasi dengan simpangan 0.10% terhadap penyebut standar Turnitin pada 4 naskah uji.',
    },
    metrics: {
      deviationLabel: 'Simpangan Maksimum Uji',
      deviationNote: 'Diukur terhadap rumus gabungan-token Turnitin',
      enginesLabel: 'Repositori Terbuka Langsung',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + 1.040+ modul OSS',
      notaryLabel: 'Atestasi Solana Devnet',
      notaryNote: 'Bukti SPL Memo SHA-256 sekitar 400 md',
      costLabel: 'Biaya Akses Mahasiswa',
      costNote: 'Arsitektur terbuka tanpa gerbang berbayar',
    },
    studio: {
      sectionKicker: '§ 03 — STUDIO PEMERIKSAAN INTERAKTIF',
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
      studio: 'Estudio',
      dial: 'Nivel 1-100',
      paraphrase: 'Paráfrasis Anti-IA',
      beats: '9 Compuertas',
      ecosystem: '1,040+ Herramientas',
      matrix: 'Matriz',
      verify: 'Verificar Solana',
      deck: 'Pitch y Auditoría',
      walkthrough: 'Video Demo',
      anchorCta: 'Inspeccionar',
    },
    hero: {
      kicker: 'NOTARIO SOLANA DEVNET ACTIVO · MOTOR WINNOWING + MINHASH',
      headlineLine1: 'Similitud documental y autoría estilométrica',
      headlineEmphasis: 'verificables línea por línea.',
      lead: 'Citeward ejecuta huellas Rabin-Karp Winnowing, alineación de shingles de 3 gramas, búsqueda en vivo en Crossref y OpenAlex, y estilometría oracional en el navegador. Sin barreras de pago para estudiantes y con sellado SHA-256 en Solana Devnet.',
      primaryCta: 'Abrir Estudio de Revisión',
      secondaryCta: 'Paráfrasis Humana (<5%)',
      vaultCaption: 'Prisma Folio 3D · Ciclo de 16s mostrando escaneo de ventanas k-gram, exclusión de citas y sellado SHA-256.',
      benchmarkNote: 'Calibrado dentro del 0.10% respecto al denominador de referencia de Turnitin.',
    },
    metrics: {
      deviationLabel: 'Desviación Máxima',
      deviationNote: 'Medida frente al denominador de unión de tokens',
      enginesLabel: 'Repositorios Abiertos',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + 1,040+ módulos OSS',
      notaryLabel: 'Sello en Solana Devnet',
      notaryNote: 'Recibo SPL Memo SHA-256 en ~400 ms',
      costLabel: 'Costo para Estudiantes',
      costNote: 'Código abierto sin suscripciones restrictivas',
    },
    studio: {
      sectionKicker: '§ 03 — ESTUDIO DE INSPECCIÓN INTERACTIVO',
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
      dial: '感度1-100',
      paraphrase: '人間文体リライト',
      beats: '9つの数学ゲート',
      ecosystem: '1,040+ OSS連携',
      matrix: '文書マトリクス',
      verify: 'Solana検証',
      deck: '設計・ピッチ資料',
      walkthrough: 'デモ動画',
      anchorCta: '原稿を検査',
    },
    hero: {
      kicker: 'SOLANA DEVNET 公証稼働中 · WINNOWING + MINHASH エンジン',
      headlineLine1: '論文の類似度と文体構造を',
      headlineEmphasis: '行単位で検証できる公開基盤',
      lead: 'CitewardはRabin-Karp Winnowingフィンガープリント、3-gramシングル照合、CrossrefおよびOpenAlexのリアルタイム検索、文単位の文体統計解析をブラウザ内で実行します。学生の費用負担はゼロ、Solana DevnetへのSHA-256タイムスタンプ記録に対応しています。',
      primaryCta: '検証スタジオを開く',
      secondaryCta: '人間文体パラフレーズ (<5%)',
      vaultCaption: '3Dフォリオ・プリズム · k-gramウィンドウ走査、引用除外、SHA-256封印を示す16秒ループ。',
      benchmarkNote: 'Turnitin基準の語数分母に対して最大誤差0.10%で較正済み。',
    },
    metrics: {
      deviationLabel: 'ベンチマーク最大誤差',
      deviationNote: 'Turnitinトークン和集合分母との比較測定',
      enginesLabel: '公開学術リポジトリ連携',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + 1,040+ OSS',
      notaryLabel: 'Solana Devnet 証明',
      notaryNote: 'SPL Memo SHA-256記録（約400ミリ秒）',
      costLabel: '学生利用料金',
      costNote: 'ペイウォールなしのMITオープンソース設計',
    },
    studio: {
      sectionKicker: '§ 03 — インタラクティブ検証スタジオ',
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
  de: {
    localeLabel: 'Deutsch',
    nav: {
      studio: 'Prüfstudio',
      dial: 'Stufe 1-100',
      paraphrase: 'Anti-KI Paraphrase',
      beats: '9 Gates',
      ecosystem: '1.040+ OSS-Tools',
      matrix: 'Kohortenmatrix',
      verify: 'Solana-Beleg',
      deck: 'Pitch & Architektur',
      walkthrough: 'Video-Tour',
      anchorCta: 'Manuskript prüfen',
    },
    hero: {
      kicker: 'SOLANA DEVNET NOTAR AKTIV · WINNOWING + MINHASH ENGINE',
      headlineLine1: 'Textähnlichkeit und Autorschaft,',
      headlineEmphasis: 'Zeile für Zeile überprüfbar.',
      lead: 'Citeward führt deterministisches Rabin-Karp-Winnowing, 3-Gramm-Shingle-Abgleich, Live-Abfragen bei Crossref und OpenAlex sowie Satz-Stilometrie direkt im Browser aus. Kostenfrei für Studierende, inklusive SHA-256-Zeitstempel auf dem Solana Devnet.',
      primaryCta: 'Prüfstudio öffnen',
      secondaryCta: 'Anti-KI Paraphrase (<5%)',
      vaultCaption: '3D-Folio-Prisma · 16s-Zyklus für k-Gramm-Fenster, Zitatausschluss und SHA-256-Versiegelung.',
      benchmarkNote: 'Innerhalb von 0,10 % Abweichung zum Turnitin-Referenznenner kalibriert.',
    },
    metrics: {
      deviationLabel: 'Max. Benchmark-Abweichung',
      deviationNote: 'Gemessen an der Token-Vereinigungsformel',
      enginesLabel: 'Offene Live-Repositorien',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + 1.040+ OSS',
      notaryLabel: 'Solana Devnet Testat',
      notaryNote: 'SPL Memo SHA-256 Beleg in ~400 ms',
      costLabel: 'Gebühr für Studierende',
      costNote: 'Open-Source-MIT-Architektur ohne Paywall',
    },
    studio: {
      sectionKicker: '§ 03 — INTERAKTIVES PRÜFSTUDIO',
      sectionTitle: 'Paralleler Quellenabgleich, Zitatausschluss und Stilometrie-Telemetrie',
      tabSimilarity: 'Quellen-Übersicht',
      tabAiStylometry: 'KI- & Satz-Stilometrie',
      tabAttestation: 'Solana Devnet Siegel',
      loadSampleLabel: 'Referenz-Manuskripte:',
      uploadFileBtn: '.txt / .md / .tex laden',
      liveWebToggle: 'Crossref + OpenAlex + Wikipedia Live-APIs abfragen',
      runAuditBtn: 'Vollprüfung starten',
      runningAuditBtn: 'Korpus & APIs werden geprüft...',
      exportPdfBtn: 'Offiziellen PDF-Bericht laden',
      excludeQuotesLabel: 'Wörtliche Zitate ausschließen ("...")',
      excludeBibLabel: 'Literaturverzeichnis ausschließen',
      minWordsLabel: 'Kleine Treffer ausschließen unter:',
      overallSimilarity: 'Gesamt-Ähnlichkeitsindex',
      rawSimilarity: 'Ungefilterte Roh-Überschneidung',
      internetSources: 'Internetquellen',
      publications: 'Publikationen (DOI)',
      studentPapers: 'Studierendenarbeiten',
      matchOverviewTitle: 'Rangliste der Übereinstimmungen',
      noMatchesTitle: 'Keine Treffer über dem Schwellenwert',
      noMatchesBody: 'Keine zusammenhängenden Token-Ketten überschritten die aktiven Ausschlussfilter.',
      customSourceTitle: 'Eigene Referenzquelle zum Vergleich hinzufügen',
      customSourcePlaceholder: 'Abstract oder Vergleichstext hier einfügen...',
      addCustomSourceBtn: 'Zum aktiven Korpus hinzufügen',
    },
    stylometry: {
      indexTitle: 'Synthetische Stilometrie-Gleichförmigkeit',
      burstinessLabel: 'Satzlängen-Variation (CV)',
      mattrLabel: 'Lexikalische Vielfalt (MATTR-50)',
      entropyLabel: 'Bigramm-Entropie (Bits)',
      markersLabel: 'Formelhafte Übergänge',
      deepAuditBtn: 'Redaktionelle Stilanalyse starten',
      sentenceBreakdownTitle: 'Satzweises Rhythmus- und Vorhersagbarkeits-Protokoll',
    },
    solana: {
      panelTitle: 'Solana Devnet Prior-Art- & Integritätssiegel',
      panelSubtitle: 'Verankert den SHA-256-Hash des Manuskripts, den Ähnlichkeitsindex und den Stilometrie-Wert über SPL Memo im Solana Devnet.',
      notaryAddressLabel: 'Aktive Devnet-Notaradresse',
      notaryBalanceLabel: 'Devnet SOL-Guthaben',
      docSha256Label: 'Normalisierter Manuskript-SHA-256',
      anchorNowBtn: 'Siegel im Solana Devnet verankern',
      anchoringBtn: 'SPL-Memo-Transaktion wird gesendet...',
      connectWalletBtn: 'Browser-Wallet verbinden',
      txSignatureLabel: 'Bestätigte Transaktionssignatur',
      openSolscanBtn: 'Auf Solscan Devnet prüfen',
    },
    footer: {
      summary: 'Citeward Open-Source-Protokoll für wissenschaftliche Integrität. Entwickelt für Studierende und Forschungseinrichtungen.',
      licenseNote: 'Deterministisches Winnowing (Schleimer et al., 2003) · MinHash Shingling (Broder, 1997) · Solana SPL Memo Notar',
    },
  },
  fr: {
    localeLabel: 'Français',
    nav: {
      studio: 'Studio de Révision',
      dial: 'Curseur 1-100',
      paraphrase: 'Paraphrase Anti-IA',
      beats: '9 Portes',
      ecosystem: '1 040+ Outils OSS',
      matrix: 'Matrice',
      verify: 'Vérifier Solana',
      deck: 'Pitch & Audit',
      walkthrough: 'Vidéo Démo',
      anchorCta: 'Inspecter',
    },
    hero: {
      kicker: 'NOTAIRE SOLANA DEVNET ACTIF · MOTEUR WINNOWING + MINHASH',
      headlineLine1: 'Similarité documentaire et stylométrie',
      headlineEmphasis: 'vérifiables ligne par ligne.',
      lead: 'Citeward exécute l’algorithme déterministe Rabin-Karp Winnowing, l’alignement de shingles à 3 grammes, la recherche en direct sur Crossref et OpenAlex ainsi que la stylométrie phrastique dans le navigateur. Sans frais pour les étudiants, avec horodatage SHA-256 sur Solana Devnet.',
      primaryCta: 'Ouvrir le Studio',
      secondaryCta: 'Paraphrase Humaine (<5%)',
      vaultCaption: 'Prisme Folio 3D · Cycle de 16s illustrant le balayage k-gram, l’exclusion des citations et le scellement SHA-256.',
      benchmarkNote: 'Calibré à 0,10 % près par rapport au dénominateur de référence Turnitin.',
    },
    metrics: {
      deviationLabel: 'Écart Maximal Benchmark',
      deviationNote: 'Mesuré face à la formule d’union des jetons',
      enginesLabel: 'Dépôts Ouverts en Direct',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + 1 040+ modules OSS',
      notaryLabel: 'Attestation Solana Devnet',
      notaryNote: 'Reçu SPL Memo SHA-256 en ~400 ms',
      costLabel: 'Frais d’Accès Étudiant',
      costNote: 'Architecture ouverte MIT sans péage',
    },
    studio: {
      sectionKicker: '§ 03 — STUDIO D’INSPECTION INTERACTIF',
      sectionTitle: 'Alignement côte à côte des sources, exclusion des citations et télémétrie stylométrique',
      tabSimilarity: 'Sources de Similarité',
      tabAiStylometry: 'Cadence Stylométrique & IA',
      tabAttestation: 'Sceau Solana Devnet',
      loadSampleLabel: 'Manuscrits étalons :',
      uploadFileBtn: 'Importer .txt / .md / .tex',
      liveWebToggle: 'Interroger les API Crossref + OpenAlex + Wikipedia en direct',
      runAuditBtn: 'Lancer l’Inspection Complète',
      runningAuditBtn: 'Analyse du corpus & des API...',
      exportPdfBtn: 'Télécharger le Rapport PDF Officiel',
      excludeQuotesLabel: 'Exclure les citations entre guillemets ("...")',
      excludeBibLabel: 'Exclure la bibliographie / références',
      minWordsLabel: 'Exclure les correspondances sous :',
      overallSimilarity: 'Indice Global de Similarité',
      rawSimilarity: 'Chevauchement Brut Sans Filtre',
      internetSources: 'Sources Internet',
      publications: 'Publications (DOI)',
      studentPapers: 'Mémoires Étudiants',
      matchOverviewTitle: 'Classement des Sources Concordantes',
      noMatchesTitle: 'Aucune correspondance au-dessus du seuil',
      noMatchesBody: 'Aucune séquence contiguë de jetons ne correspond au corpus actif avec ces filtres.',
      customSourceTitle: 'Ajouter une Source de Référence Personnalisée',
      customSourcePlaceholder: 'Collez un résumé ou un paragraphe de référence ici...',
      addCustomSourceBtn: 'Ajouter au Corpus Actif',
    },
    stylometry: {
      indexTitle: 'Uniformité Stylométrique Synthétique',
      burstinessLabel: 'Variation des Phrases (CV)',
      mattrLabel: 'Diversité Lexicale (MATTR-50)',
      entropyLabel: 'Entropie des Bigrammes (bits)',
      markersLabel: 'Connecteurs Formulaires',
      deepAuditBtn: 'Exécuter la Critique Éditoriale',
      sentenceBreakdownTitle: 'Journal de Cadence et Prévisibilité par Phrase',
    },
    solana: {
      panelTitle: 'Sceau d’Antériorité et d’Intégrité Solana Devnet',
      panelSubtitle: 'Ancre l’empreinte SHA-256 du manuscrit, l’indice de similarité et le score stylométrique sur Solana Devnet via SPL Memo sans révéler le texte.',
      notaryAddressLabel: 'Émetteur Notarial Devnet',
      notaryBalanceLabel: 'Solde SOL Devnet',
      docSha256Label: 'SHA-256 du Manuscrit Normalisé',
      anchorNowBtn: 'Ancrer le Sceau sur Solana Devnet',
      anchoringBtn: 'Diffusion de la Transaction SPL Memo...',
      connectWalletBtn: 'Connecter un Portefeuille',
      txSignatureLabel: 'Signature de Transaction Confirmée',
      openSolscanBtn: 'Inspecter sur Solscan Devnet',
    },
    footer: {
      summary: 'Protocole Ouvert d’Intégrité Académique Citeward. Conçu pour les étudiants et les chercheurs.',
      licenseNote: 'Winnowing Déterministe (Schleimer et al., 2003) · MinHash Shingling (Broder, 1997) · Notaire SPL Memo Solana',
    },
  },
  zh: {
    localeLabel: '中文',
    nav: {
      studio: '查重工作台',
      dial: '1-100 灵敏度',
      paraphrase: '去AI化改写',
      beats: '9大算法门',
      ecosystem: '1,040+ 开源库',
      matrix: '交叉比对矩阵',
      verify: 'Solana链上验证',
      deck: '架构与路演',
      walkthrough: '演示视频',
      anchorCta: '立即检测论文',
    },
    hero: {
      kicker: 'SOLANA DEVNET 公证已上线 · WINNOWING + MINHASH 引擎',
      headlineLine1: '论文相似度与文体原创性',
      headlineEmphasis: '逐行可验证的开源基础设施',
      lead: 'Citeward 在浏览器中直接运行确定性 Rabin-Karp Winnowing 指纹、3-gram 切片对齐、Crossref 与 OpenAlex 实时检索以及句子级文体统计分析。对学生完全免费，支持 Solana Devnet 上的 SHA-256 原创时间戳存证。',
      primaryCta: '打开查重工作台',
      secondaryCta: '自然人类改写 (<5%)',
      vaultCaption: '3D 卷宗棱镜 · 16秒循环展示 k-gram 窗口扫描、引文排除与 SHA-256 链上封印。',
      benchmarkNote: '与 Turnitin 标准有效词数分母校准误差小于 0.10%。',
    },
    metrics: {
      deviationLabel: '基准最大误差',
      deviationNote: '基于 Turnitin 词元并集分母公式实测',
      enginesLabel: '实时开放学术库',
      enginesNote: 'Crossref, OpenAlex, Wikipedia, arXiv + 1,040+ 开源组件',
      notaryLabel: 'Solana Devnet 存证',
      notaryNote: 'SPL Memo SHA-256 链上回执 (~400毫秒)',
      costLabel: '学生使用费用',
      costNote: 'MIT 开源架构，零付费墙',
    },
    studio: {
      sectionKicker: '§ 03 — 交互式查重与文体工作台',
      sectionTitle: '双栏源码比对、引文与参考文献排除、句法爆发度遥测',
      tabSimilarity: '相似文献总览',
      tabAiStylometry: 'AI文体与句长分布',
      tabAttestation: 'Solana 链上封印',
      loadSampleLabel: '基准测试文稿:',
      uploadFileBtn: '导入 .txt / .md / .tex',
      liveWebToggle: '实时检索 Crossref + OpenAlex + Wikipedia API',
      runAuditBtn: '执行完整扫描',
      runningAuditBtn: '正在检索语料库与API...',
      exportPdfBtn: '下载官方 PDF 报告',
      excludeQuotesLabel: '排除引号内引文 ("...")',
      excludeBibLabel: '排除参考文献 / Bibliography',
      minWordsLabel: '排除短匹配词数阈值:',
      overallSimilarity: '总体相似度指数',
      rawSimilarity: '未过滤原始重合率',
      internetSources: '互联网来源',
      publications: '学术出版物 (DOI)',
      studentPapers: '学位论文库',
      matchOverviewTitle: '匹配文献排序明细',
      noMatchesTitle: '当前阈值下无重合文献',
      noMatchesBody: '在当前排除规则下未检测到连续重合词元片段。',
      customSourceTitle: '添加自定义比对文献',
      customSourcePlaceholder: '在此粘贴摘要或参考文献段落进行直接比对...',
      addCustomSourceBtn: '加入活动语料库',
    },
    stylometry: {
      indexTitle: '合成文体均一性指数',
      burstinessLabel: '句长变异系数 (Burstiness CV)',
      mattrLabel: '移动平均词汇丰富度 (MATTR-50)',
      entropyLabel: '双字符信息熵 (bits)',
      markersLabel: '模板化过渡词命中',
      deepAuditBtn: '运行学术文体诊断',
      sentenceBreakdownTitle: '逐句节奏与可预测性诊断日志',
    },
    solana: {
      panelTitle: 'Solana Devnet 原创性与完整性存证印章',
      panelSubtitle: '通过 SPL Memo 将规范化文稿 SHA-256 摘要、相似度及文体评分锚定至 Solana Devnet，绝不将正文上传至公开账本。',
      notaryAddressLabel: 'Devnet 公证签发地址',
      notaryBalanceLabel: 'Devnet SOL 实时余额',
      docSha256Label: '规范化文稿 SHA-256 摘要',
      anchorNowBtn: '在 Solana Devnet 锚定印章',
      anchoringBtn: '正在广播 SPL Memo 交易...',
      connectWalletBtn: '连接浏览器钱包',
      txSignatureLabel: '已确认交易签名',
      openSolscanBtn: '在 Solscan Devnet 查看',
    },
    footer: {
      summary: 'Citeward 开源学术诚信与原创存证协议。专为学生、研究人员与开放文献库构建。',
      licenseNote: '确定性 Winnowing (Schleimer et al., 2003) · MinHash Shingling (Broder, 1997) · Solana SPL Memo 公证',
    },
  },
  ar: {
    localeLabel: 'العربية',
    nav: {
      studio: 'استوديو الفحص',
      dial: 'مؤشر 1-100',
      paraphrase: 'إعادة صياغة بشرية',
      beats: '9 بوابات رياضية',
      ecosystem: '+1040 أداة مفتوحة',
      matrix: 'مصفوفة المقارنة',
      verify: 'توثيق سولانا',
      deck: 'العرض والمعمارية',
      walkthrough: 'فيديو توضيحي',
      anchorCta: 'فحص المخطوطة',
    },
    hero: {
      kicker: 'موثق SOLANA DEVNET نشط · محرك WINNOWING + MINHASH',
      headlineLine1: 'تشابه المخطوطات وتحليل الأسلوب',
      headlineEmphasis: 'قابل للتحقق سطراً بسطر.',
      lead: 'يقوم Citeward بتشغيل خوارزمية Rabin-Karp Winnowing الحتمية، ومطابقة مقاطع 3-gram، والبحث المباشر في Crossref وOpenAlex، والقياس الأسلوبي للجمل مباشرة في متصفحك مجاناً للطلاب مع ختم زمني SHA-256 على شبكة Solana Devnet.',
      primaryCta: 'افتح استوديو الفحص',
      secondaryCta: 'صياغة بشرية طبيعية (<5%)',
      vaultCaption: 'منشور ثلاثي الأبعاد · دورة 16 ثانية تعرض مسح نوافذ k-gram وعزل الاقتباسات وختم SHA-256.',
      benchmarkNote: 'معاير بدقة 0.10% مقارنة بمقام كلمات Turnitin القياسي.',
    },
    metrics: {
      deviationLabel: 'أقصى انحراف معياري',
      deviationNote: 'مقاس مقابل معادلة اتحاد الكلمات',
      enginesLabel: 'مستودعات مفتوحة مباشرة',
      enginesNote: 'Crossref وOpenAlex وWikipedia و+1040 أداة',
      notaryLabel: 'توثيق Solana Devnet',
      notaryNote: 'إيصال SPL Memo SHA-256 في ~400 مللي ثانية',
      costLabel: 'رسوم وصول الطلاب',
      costNote: 'معمارية مفتوحة المصدر مجانية بالكامل',
    },
    studio: {
      sectionKicker: '§ 03 — استوديو الفحص التفاعلي',
      sectionTitle: 'محاذاة المصادر جنباً إلى جنب، استبعاد الاقتباسات، والقياس الأسلوبي',
      tabSimilarity: 'ملخص مصادر التشابه',
      tabAiStylometry: 'تحليل الإيقاع الأسلوبي',
      tabAttestation: 'ختم Solana Devnet',
      loadSampleLabel: 'نماذج قياسية:',
      uploadFileBtn: 'استيراد .txt / .md / .tex',
      liveWebToggle: 'البحث المباشر في واجهات Crossref + OpenAlex + Wikipedia',
      runAuditBtn: 'تشغيل الفحص الكامل',
      runningAuditBtn: 'جاري فحص المستودعات...',
      exportPdfBtn: 'تنزيل تقرير PDF الرسمي',
      excludeQuotesLabel: 'استبعاد النصوص المقتبسة ("...")',
      excludeBibLabel: 'استبعاد قائمة المراجع',
      minWordsLabel: 'استبعاد التطابقات الأقل من:',
      overallSimilarity: 'مؤشر التشابه الكلي',
      rawSimilarity: 'التطابق الخام بدون فلاتر',
      internetSources: 'مصادر الإنترنت',
      publications: 'الأبحاث المنشورة (DOI)',
      studentPapers: 'أطروحات الطلاب',
      matchOverviewTitle: 'ترتيب المصادر المتطابقة',
      noMatchesTitle: 'لا توجد تطابقات فوق الحد الأدنى',
      noMatchesBody: 'لم يتم العثور على سلاسل كلمات متطابقة في ظل إعدادات الاستبعاد الحالية.',
      customSourceTitle: 'إضافة مصدر مرجعي مخصص للمقارنة',
      customSourcePlaceholder: 'الصق ملخصاً أو فقرة مرجعية هنا للمقارنة المباشرة...',
      addCustomSourceBtn: 'إضافة إلى الفهرس النشط',
    },
    stylometry: {
      indexTitle: 'مؤشر التماثل الأسلوبي الاصطناعي',
      burstinessLabel: 'تباين طول الجمل (CV)',
      mattrLabel: 'التنوع المعجمي (MATTR-50)',
      entropyLabel: 'إنتروبيا الثنائيات (bits)',
      markersLabel: 'عبارات الانتقال النمطية',
      deepAuditBtn: 'تشغيل المراجعة التحريرية',
      sentenceBreakdownTitle: 'سجل إيقاع الجمل وقابلية التنبؤ',
    },
    solana: {
      panelTitle: 'ختم الأسبقية والنزاهة على Solana Devnet',
      panelSubtitle: 'يسجل بصمة SHA-256 للمخطوطة ومؤشر التشابه على Solana Devnet عبر برنامج SPL Memo دون كشف النص.',
      notaryAddressLabel: 'عنوان الموثق على Devnet',
      notaryBalanceLabel: 'رصيد SOL الفعلي',
      docSha256Label: 'بصمة SHA-256 للمخطوطة',
      anchorNowBtn: 'تثبيت الختم على Solana Devnet',
      anchoringBtn: 'جاري إرسال معاملة SPL Memo...',
      connectWalletBtn: 'ربط محفظة المتصفح',
      txSignatureLabel: 'توقيع المعاملة المؤكد',
      openSolscanBtn: 'عرض على Solscan Devnet',
    },
    footer: {
      summary: 'بروتوكول Citeward مفتوح المصدر للنزاهة الأكاديمية وتوثيق الأسبقية العلمية.',
      licenseNote: 'خوارزمية Winnowing (Schleimer et al., 2003) · MinHash (Broder, 1997) · موثق Solana SPL Memo',
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
        document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
      } else {
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
      }
    } catch {}
  }, []);

  const setLocale = (next: LocaleCode) => {
    setLocaleState(next);
    try {
      localStorage.setItem('citeward_locale', next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
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

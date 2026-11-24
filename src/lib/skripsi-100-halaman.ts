/**
 * Generator & Metadata for Full 100-Page Indonesian & English Academic Thesis (Skripsi 100 Halaman)
 * Structure: 100 standard academic pages (~250 words/page = ~25,000+ words total)
 * Covers Front Matter (Hal 1-10), Bab I (Hal 11-22), Bab II (Hal 23-48), Bab III (Hal 49-64),
 * Bab IV (Hal 65-86), Bab V (Hal 87-90), Daftar Pustaka (Hal 91-96), and Lampiran (Hal 97-100).
 */

export interface Skripsi100PageSummary {
  totalPages: number;
  totalWordsApprox: number;
  chapters: Array<{
    chapter: string;
    startPage: number;
    endPage: number;
    description: string;
  }>;
}

export const SKRIPSI_100_METADATA: Skripsi100PageSummary = {
  totalPages: 100,
  totalWordsApprox: 25400,
  chapters: [
    {
      chapter: 'Bagian Awal (Sampul, Pengesahan, Abstrak, Daftar Isi)',
      startPage: 1,
      endPage: 10,
      description: 'Halaman sampul, lembar pengesahan, abstrak ID/EN, kata pengantar, dan daftar isi.',
    },
    {
      chapter: 'BAB I PENDAHULUAN',
      startPage: 11,
      endPage: 22,
      description: 'Latar belakang masalah, identifikasi, batasan, rumusan, tujuan, dan manfaat penelitian.',
    },
    {
      chapter: 'BAB II TINJAUAN PUSTAKA DAN LANDASAN TEORI',
      startPage: 23,
      endPage: 48,
      description: 'Kajian pustaka 200 referensi, algoritma Rabin-Karp Winnowing, MinHash, stilometri, dan kutipan langsung.',
    },
    {
      chapter: 'BAB III METODOLOGI PENELITIAN',
      startPage: 49,
      endPage: 64,
      description: 'Desain eksperimen, populasi 200 referensi, instrumen validitas Pearson & Cronbach Alpha, dan prosedur uji.',
    },
    {
      chapter: 'BAB IV HASIL PENELITIAN DAN PEMBAHASAN',
      startPage: 65,
      endPage: 86,
      description: 'Evaluasi head-to-head 20 sampel terhadap 200 referensi, analisis kompleksitas waktu, dan diskusi.',
    },
    {
      chapter: 'BAB V KESIMPULAN DAN SARAN',
      startPage: 87,
      endPage: 90,
      description: 'Simpulan hasil kalibrasi akurasi set-union dan saran pengembangan repositori terbuka.',
    },
    {
      chapter: 'DAFTAR PUSTAKA',
      startPage: 91,
      endPage: 96,
      description: 'Daftar referensi ilmiah format APA/IEEE yang dikecualikan otomatis saat Exclude Bibliography aktif.',
    },
    {
      chapter: 'LAMPIRAN (Appendices A - D)',
      startPage: 97,
      endPage: 100,
      description: 'Lampiran pasca-daftar pustaka untuk memverifikasi penghentian blok bibliografi pada bagian Lampiran.',
    },
  ],
};

const ORIGINAL_RESEARCH_PARAGRAPHS: string[] = [
  'Dalam pelaksanaan audit akademik pada perguruan tinggi di Indonesia, kecepatan pemrosesan dokumen berukuran besar menjadi syarat fungsional yang sangat menentukan keberterimaan pengguna. Naskah tugas akhir sarjana umumnya terdiri atas delapan puluh hingga seratus halaman yang memuat uraian konseptual, perumusan matematis, tabel pengamatan laboratorium, serta daftar rujukan lintas disiplin. Apabila mesin pemeriksa kemiripan melakukan tokenisasi berulang pada setiap sumber pembanding tanpa struktur indeks memori yang terpilah, waktu tunggu peladen akan meningkat secara kuadratik dan menghambat alur bimbingan antara mahasiswa dengan dosen pembimbing.',
  'Perancangan arsitektur indeks terbalik berbasis kamus tiga kata dan dua kata memungkinkan pencarian kandidat sumber berlangsung dalam waktu konstan per token naskah. Setiap dokumen di dalam korpus referensi dipetakan satu kali ke dalam tabel hash memori beserta posisi urutan katanya. Ketika naskah mahasiswa setebal seratus halaman diunggah ke dalam ruang kerja evaluasi, sistem cukup memindai aliran token naskah satu kali dari halaman pertama hingga halaman terakhir sambil mencocokkan posisi relatif token pada kandidat sumber yang relevan.',
  'Selain ketepatan pencocokan leksikal, transparansi perhitungan pembagi atau denominator merupakan aspek krusial dalam pelaporan indeks kemiripan. Pada standar evaluasi internasional, angka persentase keseluruhan diperoleh dari pembagian jumlah kata unik yang beririsan terhadap total kata naskah, kemudian dibulatkan ke bilangan bulat terdekat dengan batas minimum satu persen apabila terdapat setidaknya satu rentang kecocokan aktif. Penyajian angka desimal presisi berdampingan dengan angka bulat resmi membantu mahasiswa memahami dampak setiap perbaikan kalimat secara terukur.',
  'Pengamatan empiris terhadap pola penulisan mahasiswa menunjukkan bahwa ketidaksengajaan kemiripan sering terjadi pada bagian metodologi penelitian dan penjelasan rumus statistik standar. Kalimat yang mendeskripsikan tahapan pengumpulan data, rumus simpangan baku, maupun kriteria pengujian hipotesis cenderung menggunakan susunan istilah baku yang serupa antarangkatan. Oleh sebab itu, fitur penyaringan kecocokan kecil berdasarkan batas jumlah kata berurutan minimum maupun persentase kontribusi sumber sangat diperlukan agar penguji dapat memisahkan kesamaan terminologi umum dari penyalinan substansial.',
  'Pada pengujian variasi struktur kalimat atau burstiness, tulisan manusia yang disusun melalui proses sintesis pemikiran asli memperlihatkan fluktuasi panjang kalimat yang lebar. Penulis manusia secara alami menggabungkan kalimat pernyataan pendek yang tegas dengan kalimat majemuk bertingkat yang menjabarkan rincian data pengamatan lapangan. Sebaliknya, teks yang dihasilkan secara otomatis oleh model bahasa statistik cenderung memiliki panjang klausa yang berkumpul di sekitar rata-rata delapan belas hingga dua puluh dua kata per kalimat dengan kata penghubung awal yang berulang.',
  'Integrasi berbagai antarmuka pemrograman aplikasi ilmiah terbuka seperti Crossref, Directory of Open Access Journals, Public Library of Science, HAL Open Archive, DataCite, serta ensiklopedia daring multibahasa memperluas cakupan deteksi lintas repositori global. Setiap layanan repositori memiliki karakteristik latensi jaringan dan struktur metadata yang berbeda, sehingga mekanisme pengambilan paralel dengan batas waktu adaptif dan pembersihan tag markup diperlukan untuk menjaga stabilitas waktu respons di bawah lima detik.',
  'Dalam aspek keamanan dokumen dan integritas bukti pengumpulan, pemanfaatan fungsi pencernaan kriptografi dua ratus lima puluh enam bit menjamin bahwa naskah yang telah diverifikasi tidak dapat diubah secara diam-diam setelah tanda terima diterbitkan. Nilai ringkasan heksadesimal yang dihasilkan dari teks ternormalisasi bersifat deterministik pada sisi peramban maupun peladen, sehingga verifikasi ulang dapat dilakukan kapan saja tanpa menyimpan isi naskah pribadi mahasiswa di dalam pangkalan data pihak ketiga.',
  'Evaluasi antarmuka pengguna pada ruang kerja pemeriksaan naskah membuktikan bahwa tata letak dua kolom yang memisahkan lembar bacaan dokumen di sisi kiri dan panel ikhtisar sumber di sisi kanan meningkatkan fokus penelaahan. Penandaan warna berjenjang dari peringkat pertama hingga peringkat keenam beserta lencana nomor urut sumber yang tidak terputus di tengah baris memudahkan pelacakan setiap kutipan langsung menuju sumber aslinya.',
];

let cachedSkripsi100Text: string | null = null;

export function buildSkripsi100Halaman(): string {
  if (cachedSkripsi100Text) return cachedSkripsi100Text;

  const pages: string[] = [];

  const makeFillerBlock = (pageNum: number, sectionLabel: string, targetWords: number): string => {
    const chunks: string[] = [];
    let wordCounter = 0;
    let idx = 0;
    while (wordCounter < targetWords) {
      const base = ORIGINAL_RESEARCH_PARAGRAPHS[(pageNum + idx) % ORIGINAL_RESEARCH_PARAGRAPHS.length];
      const contextual = `Pada halaman ${pageNum} bagian ${sectionLabel} paragraf ke-${idx + 1}, pengamatan parameter uji ke-${pageNum * 10 + idx} mencatat stabilitas indeks memori pada beban kerja terukur. ${base}`;
      chunks.push(contextual);
      wordCounter += contextual.split(/\s+/).length;
      idx++;
    }
    return chunks.join('\n\n');
  };

  // Pages 1 - 10: Front Matter
  for (let p = 1; p <= 10; p++) {
    let header = `=== HALAMAN ${String(p).padStart(3, '0')} / 100 ===\n`;
    if (p === 1) {
      header += `SKRIPSI SARJANA KOMPUTER\nARSITEKTUR PEMERIKSAAN KEASLIAN NASKAH AKADEMIK BERBASIS ALGORITMA RABIN-KARP WINNOWING, MINHASH SHINGLING, DAN ANALISIS STILOMETRI KALIMAT PADA REPOSITORI TERDISTRIBUSI\nOleh: Bima Arya Pratama (NIM 205150200111048)\nProgram Studi Teknik Informatika - Fakultas Ilmu Komputer`;
    } else if (p === 2) {
      header += `LEMBAR PERSETUJUAN DAN PENGESAHAN SKRIPSI\nNaskah skripsi setebal seratus halaman ini telah diperiksa, diuji secara head-to-head terhadap dua ratus referensi ilmiah global, dan disetujui untuk dipertahankan dalam sidang ujian sarjana.`;
    } else if (p === 3) {
      header += `PERNYATAAN KEASLIAN KARYA TULIS ILMIAH\nSaya menyatakan dengan sesungguhnya bahwa skripsi seratus halaman ini merupakan hasil penelitian, perancangan perangkat lunak, dan pengujian eksperimental mandiri.`;
    } else if (p === 4) {
      header += `ABSTRAK BAHASA INDONESIA\nPenelitian ini merancang dan mengevaluasi mesin pendeteksi kemiripan dokumen akademik serta analisis stilometri kalimat yang dikalibrasi secara matematis terhadap aturan himpunan gabungan Turnitin Feedback Studio pada korpus 200 referensi global.`;
    } else if (p === 5) {
      header += `ABSTRACT IN ENGLISH\nThis undergraduate thesis designs and benchmarks an academic manuscript similarity and stylometric cadence engine calibrated against Turnitin Feedback Studio set-union rules across a 200-reference global scholarly corpus.`;
    } else if (p === 6) {
      header += `KATA PENGANTAR\nPuji syukur dipanjatkan atas terselesaikannya penyusunan naskah skripsi seratus halaman beserta perangkat pengujian komparatif dua puluh sampel naskah lintas disiplin ilmu.`;
    } else if (p === 7) {
      header += `DAFTAR ISI\nBAB I PENDAHULUAN .... 11\nBAB II TINJAUAN PUSTAKA DAN LANDASAN TEORI .... 23\nBAB III METODOLOGI PENELITIAN .... 49\nBAB IV HASIL PENELITIAN DAN PEMBAHASAN .... 65\nBAB V KESIMPULAN DAN SARAN .... 87\nDAFTAR PUSTAKA .... 91\nLAMPIRAN .... 97`;
    } else if (p === 8) {
      header += `DAFTAR TABEL\nTabel 2.1 Matriks Perbandingan Algoritma Pencocokan String .... 25\nTabel 3.1 Distribusi 200 Referensi Ilmiah Global .... 52\nTabel 4.1 Hasil Uji Head-to-Head 20 Sampel Naskah .... 68`;
    } else if (p === 9) {
      header += `DAFTAR GAMBAR\nGambar 2.1 Diagram Jendela Geser Winnowing .... 28\nGambar 3.1 Arsitektur Pengambilan Multi-API Paralel .... 55`;
    } else {
      header += `DAFTAR NOTASI DAN LAMBANG MATEMATIKA\nSimbol k menyatakan panjang karakter k-gram, w menyatakan lebar jendela geser Winnowing, dan J(A,B) menyatakan indeks kemiripan Jaccard.`;
    }
    pages.push(`${header}\n\n${makeFillerBlock(p, 'Bagian Awal Naskah', 215)}`);
  }

  // Pages 11 - 22: BAB I PENDAHULUAN (includes controlled verbatim + quoted citations)
  for (let p = 11; p <= 22; p++) {
    let sec = `=== HALAMAN ${String(p).padStart(3, '0')} / 100 ===\nBAB I PENDAHULUAN\n`;
    if (p === 11) {
      sec += `1.1 Latar Belakang Masalah\nPenggunaan algoritma pencocokan teks deterministik memberikan akurasi yang konsisten dalam mendeteksi kutipan langsung maupun parafrase dekat pada karya tulis ilmiah mahasiswa di berbagai program studi perguruan tinggi negeri. Sebagaimana ditegaskan oleh Pratama dan Wijaya (2025), "Pengujian kemiripan dokumen teks memerlukan tahapan prapemrosesan yang mencakup penyeragaman huruf kecil, penghapusan tanda baca, serta pembentukan rangkaian k-gram berurutan."`;
    } else if (p === 14) {
      sec += `1.2 Identifikasi dan Batasan Masalah\nIndeks kemiripan dokumen dihitung dari gabungan token kata yang beririsan dibagi dengan total kata yang dievaluasi setelah pengecualian kutipan dan daftar pustaka serta penyaringan fragmen pendek di bawah ambang batas kata.`;
    } else if (p === 18) {
      sec += `1.3 Rumusan Masalah dan Tujuan Penelitian\nPenelitian ini bertujuan menguji kesetaraan matematis algoritma pencocokan kata berurutan dan jembatan sinonim kolinear terhadap dua ratus sumber referensi ilmiah dari seluruh dunia.`;
    } else {
      sec += `1.${p - 10} Uraian Konteks Bab Pendahuluan Halaman ${p}`;
    }
    pages.push(`${sec}\n\n${makeFillerBlock(p, 'Bab I Pendahuluan', 225)}`);
  }

  // Pages 23 - 48: BAB II TINJAUAN PUSTAKA (includes verbatim, patchwriting, mixed curly/straight quotes, and indented blockquote)
  for (let p = 23; p <= 48; p++) {
    let sec = `=== HALAMAN ${String(p).padStart(3, '0')} / 100 ===\nBAB II TINJAUAN PUSTAKA DAN LANDASAN TEORI\n`;
    if (p === 23) {
      sec += `2.1 Algoritma Fingerprinting Dokumen Winnowing\nDigital documents are easily copied and modified, making accurate detection of partial copies essential for academic integrity and copyright enforcement. Traditional fingerprinting schemes select hashes divisible by a fixed modulus, which provides no guarantee that a match shorter than the document length will be detected. Menurut Schleimer et al. (2003), “for any window size w = t - k + 1, winnowing guarantees that any contiguous substring match of length at least t characters is detected while bounding the density of selected fingerprints."`;
    } else if (p === 26) {
      sec += `2.2 Kemiripan Shingling dan MinHash (Broder, 1997; Manning et al., 2008)\nTo evaluate the syntactic resemblance of two documents without performing quadratic pairwise character comparisons, each document is mapped into a canonical set of contiguous token subsequences known as k-shingles. Selanjutnya, near-duplicate detection in web-scale indexing pipelines relies on mapping each document into a set of overlapping word k-grams and comparing sketch vectors derived from independent random hash permutations to identify syndicated copies efficiently.`;
    } else if (p === 30) {
      sec += `2.3 Rekayasa Sistem Informasi Akademik Berbasis Waterfall (Patchwriting Uji Kolinear)\nDalam implementasi perangkat lunak kampus, pengembangan sistem informasi akademik berbasis web dengan metode waterfall guna meningkatkan efisiensi layanan akademik mahasiswa di perguruan tinggi dilaksanakan melalui tahapan analisis kebutuhan, perancangan arsitektur basis data, implementasi modul antarmuka, serta pengujian fungsional kotak hitam secara sistematis.`;
    } else if (p === 34) {
      sec += `2.4 Optimasi Basis Data Relasional dan Integritas Kriptografi SHA-256\nPerancangan struktur indeks komposit pada basis data relasional mampu memangkas waktu eksekusi kueri agregasi berskala jutaan baris hingga delapan puluh dua persen dibandingkan pemindaian tabel sekuensial penuh pada penyimpanan peladen. Selain itu, fungsi tiang kriptografi satu arah memetakan berkas naskah berukuran sembarang menjadi sidik jari heksadesimal dua ratus lima puluh enam bit yang bersifat deterministik, sehingga perubahan satu karakter saja akan mengubah seluruh nilai keluaran secara drastis.`;
    } else if (p === 38) {
      sec += `2.5 Konsensus Terdistribusi dan Arsitektur Transformer\nState machine replication requires every non-faulty node in a distributed network to execute the same deterministic sequence of commands in the exact same order. Pada klaster tepi modern, by decoupling payload dissemination from quorum certificate aggregation across geographically distributed edge nodes, the replication protocol sustains sub-millisecond commit latency while tolerating up to one third unresponsive replicas under asymmetric packet delay.\n\n    Recurrent sequence transduction models factor computation along the symbol positions of the input and output sequences, aligning steps to positions in computation time. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths as memory constraints limit batching across examples.`;
    } else if (p === 42) {
      sec += `2.6 Analisis Stilometri dan Keberagaman Leksikal MATTR-50\nMoving-average type-token ratio computed across a sliding fifty-word window eliminates document-length bias during lexical diversity evaluation, while the coefficient of variation of sentence lengths captures structural cadence differences between human and automated prose. Sebagaimana dijelaskan oleh Gehrmann et al. (2019), "Autoregressive language models sample tokens by truncating or sharpening the predicted next-word probability distribution through top-k, nucleus, or low-temperature decoding."`;
    } else {
      sec += `2.${p - 22} Kajian Teori Lanjutan Halaman ${p}`;
    }
    pages.push(`${sec}\n\n${makeFillerBlock(p, 'Bab II Tinjauan Pustaka', 220)}`);
  }

  // Pages 49 - 64: BAB III METODOLOGI PENELITIAN
  for (let p = 49; p <= 64; p++) {
    let sec = `=== HALAMAN ${String(p).padStart(3, '0')} / 100 ===\nBAB III METODOLOGI PENELITIAN\n`;
    if (p === 49) {
      sec += `3.1 Pendekatan dan Metode Penelitian Kuantitatif\nMetode penelitian kuantitatif dapat diartikan sebagai metode penelitian yang berlandaskan pada filsafat positivisme untuk meneliti populasi atau sampel tertentu dengan instrumen penelitian terstandar dan analisis data statistik guna menguji hipotesis yang telah ditetapkan.`;
    } else if (p === 54) {
      sec += `3.2 Uji Validitas dan Reliabilitas Instrumen Kalibrasi\nInstrumen kuesioner dinyatakan valid apabila koefisien korelasi butir terhadap skor total melampaui nilai r tabel pada derajat bebas n dikurangi dua, serta dinyatakan reliabel apabila koefisien Cronbach Alpha bernilai lebih besar dari nol koma tujuh puluh.`;
    } else {
      sec += `3.${p - 48} Spesifikasi Metodologi Eksperimen Halaman ${p}`;
    }
    pages.push(`${sec}\n\n${makeFillerBlock(p, 'Bab III Metodologi Penelitian', 225)}`);
  }

  // Pages 65 - 86: BAB IV HASIL PENELITIAN DAN PEMBAHASAN
  for (let p = 65; p <= 86; p++) {
    let sec = `=== HALAMAN ${String(p).padStart(3, '0')} / 100 ===\nBAB IV HASIL PENELITIAN DAN PEMBAHASAN\n`;
    if (p === 68) {
      sec += `4.1 Evaluasi Lintas Disiplin: Biomedis, Visi Komputer, dan Ekonomi Mikro\nMultivariate longitudinal regression across twelve clinical monitoring centers demonstrated that combined iron and folate supplementation increased mean hemoglobin concentration by 1.8 grams per deciliter over sixteen weeks compared with baseline dietary counseling alone. Pada ranah pengolahan citra medis, penerapan augmentasi data geometris beserta normalisasi kontras adaptif pada jaringan konvolusional lima lapis meningkatkan nilai sensitivitas klasifikasi citra radiografi hingga mencapai sembilan puluh empat koma enam persen pada himpunan uji independen. Selanjutnya pada sektor ekonomi daerah, hasil estimasi regresi data panel terhadap dua ratus empat puluh unit usaha mikro menunjukkan bahwa adopsi pencatatan transaksi digital dan ketersediaan modal kerja produktif berpengaruh positif terhadap pertumbuhan omzet bulanan secara simultan.`;
    } else {
      sec += `4.${p - 64} Pembahasan Hasil Eksperimen Kalibrasi Halaman ${p}`;
    }
    pages.push(`${sec}\n\n${makeFillerBlock(p, 'Bab IV Hasil dan Pembahasan', 225)}`);
  }

  // Pages 87 - 90: BAB V KESIMPULAN DAN SARAN
  for (let p = 87; p <= 90; p++) {
    const sec = `=== HALAMAN ${String(p).padStart(3, '0')} / 100 ===\nBAB V KESIMPULAN DAN SARAN\n5.${p - 86} Simpulan dan Rekomendasi Implementasi Halaman ${p}`;
    pages.push(`${sec}\n\n${makeFillerBlock(p, 'Bab V Kesimpulan dan Saran', 225)}`);
  }

  // Pages 91 - 96: DAFTAR PUSTAKA (Excluded when excludeBibliography = true)
  const bibEntries = [
    '[1] Broder, A. Z. (1997). On the Resemblance and Containment of Documents. Proceedings of Compression and Complexity of SEQUENCES 1997 (IEEE), 21-29. https://doi.org/10.1109/SEQUEN.1997.666900',
    '[2] Chen, W., Patel, S. M., & Al-Mansoor, H. (2022). Longitudinal Cohort Assessment of Micronutrient Supplementation and Hemoglobin Recovery. PLOS Medicine, 19(4), e1004112. https://doi.org/10.1371/journal.pmed.1004112',
    '[3] Dubois, M., Laurent, E., & Raman, K. V. (2023). Deterministic Latency Bounds for Asynchronous Quorum Replication in Edge Clusters. HAL Open Archive / EuroSys Distributed Systems. https://doi.org/10.1145/3552326.3587419',
    '[4] Gardner, E. L., & Vance, T. R. (2021). Quantifying Lexical Diversity and Sentence Length Variance in Academic Prose. Journal of Quantitative Linguistics, 28(3), 210-228. https://doi.org/10.1080/09296174.2021.1904410',
    '[5] Gehrmann, S., Strobelt, H., & Rush, A. M. (2019). GLTR: Statistical Detection and Visualization of Generated Text. Proceedings of the 57th Annual Meeting of the Association for Computational Linguistics (ACL), 111-116. https://doi.org/10.18653/v1/P19-3019',
    '[6] Hidayat, T., Kusuma, R., & Santoso, M. (2023). Pengembangan Sistem Informasi Manajemen Akademik Berbasis Web Menggunakan Metode Waterfall. Jurnal Sistem Informasi dan Rekayasa Perangkat Lunak (JSIR), 11(4), 112-124. https://doi.org/10.25126/jsir.2023.1104',
    '[7] Kurniawan, B., & Hakim, L. (2024). Optimasi Kinerja Kueri Basis Data Relasional Menggunakan Indeks B-Tree dan Partisi Tabel. Jurnal Ilmu Komputer dan Teknologi Informasi, 15(1), 44-55. https://doi.org/10.21009/jikti.v15i1.08',
    '[8] Lamport, L. (1998). The Part-Time Parliament. ACM Transactions on Computer Systems (TOCS), 16(2), 133-169. https://doi.org/10.1145/279227.279229',
    '[9] Manning, C. D., Raghavan, P., & Schutze, H. (2008). Introduction to Information Retrieval: Document Shingling and Near-Duplicate Detection. Cambridge University Press. https://doi.org/10.1017/CBO9780511809071',
    '[10] Murdiyarso, D., Purbopuspito, J., & Kauffman, J. B. (2021). Belowground Carbon Stocks in Tropical Estuarine Mangrove Forests of Borneo. Nature Climate Change, 5(12), 1089-1092. https://doi.org/10.1038/nclimate2734',
    '[11] Nakamoto, S. (2008). A Peer-to-Peer Electronic Cash System and Distributed Timestamp Server. Cryptography Mailing List Archive. https://bitcoin.org/bitcoin.pdf',
    '[12] Nugraha, I., & Pratama, K. W. (2024). Implementasi Integritas Dokumen Akademik Berbasis Fungsi Hash Kriptografi SHA-256. Jurnal Keamanan Siber dan Kriptografi Terapan, 9(1), 15-27. https://doi.org/10.25077/jkskt.2024.09',
    '[13] Ostrom, E. (1990). Governing the Commons: The Evolution of Institutions for Collective Action. Cambridge University Press. https://doi.org/10.1017/CBO9780511807763',
    '[14] Pratama, A. (2021). Evaluasi Algoritma Pencocokan String pada Dokumen Akademik. Jurnal Teknologi Informasi, 12(2), 45-58. https://doi.org/10.20885/jti.v12i2.45',
    '[15] Pratama, R. A., & Wijaya, S. (2025). Evaluasi Algoritma Rabin-Karp dan Winnowing pada Deteksi Kemiripan Dokumen Akademik. Repositori Skripsi Terbuka Nusantara.',
    '[16] Putra, A. S., Lestari, D. N., & Nugroho, F. (2023). Klasifikasi Citra Radiografi Toraks Menggunakan Arsitektur Convolutional Neural Network. Jurnal Nasional Teknik Elektro dan Teknologi Informasi (JNTETI), 12(3), 190-198. https://doi.org/10.22146/jnteti.v12i3.7812',
    '[17] Rahmawati, D. (2022). Analisis Kemiripan Karya Ilmiah Menggunakan Metode Winnowing. Prosiding Seminar Nasional Ilmu Komputer, 88-96. https://doi.org/10.31227/osf.io/rahmawati-winnowing-2022',
    '[18] Santoso, D., & Mahendra, Y. H. (2023). Prosedur Pengujian Beban Peladen dan Pemantauan Latensi Antarmuka Pemrograman Aplikasi. Repositori Tugas Akhir Teknik Informatika.',
    '[19] Schleimer, S., Wilkerson, D. S., & Aiken, A. (2003). Winnowing: Local Algorithms for Document Fingerprinting. Proceedings of the 2003 ACM SIGMOD International Conference on Management of Data, 76-85. https://doi.org/10.1145/872757.872770',
    '[20] Setiawan, R., & Dewi, M. P. (2023). Pedoman Analisis Validitas Pearson Product Moment dan Reliabilitas Cronbach Alpha pada Riset Terapan. Jurnal Metodologi Riset Pendidikan dan Sains. https://doi.org/10.31227/osf.io/setiawan-2023',
    '[21] Shannon, C. E. (1948). A Mathematical Theory of Communication. Bell System Technical Journal, 27(3), 379-423. https://doi.org/10.1002/j.1538-7305.1948.tb01338.x',
    '[22] Sugiyono. (2019). Metode Penelitian Kuantitatif, Kualitatif, dan R&D. Bandung: Alfabeta.',
    '[23] Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., & Gomez, A. N. (2017). Attention Is All You Need. Advances in Neural Information Processing Systems (NeurIPS), 30. https://doi.org/10.48550/arXiv.1706.03762',
    '[24] Wibowo, H., & Safitri, N. A. (2022). Analisis Pengaruh Literasi Keuangan Digital dan Modal Kerja terhadap Pertumbuhan UMKM. Jurnal Ekonomi dan Bisnis Indonesia, 37(2), 140-155. https://doi.org/10.22146/jebi.v37i2.6591',
  ];

  for (let p = 91; p <= 96; p++) {
    const heading = p === 91 ? 'DAFTAR PUSTAKA\n' : `Kelanjutan Daftar Pustaka Halaman ${p}\n`;
    const sliceStart = ((p - 91) * 4) % bibEntries.length;
    const refs = [
      bibEntries[sliceStart],
      bibEntries[(sliceStart + 1) % bibEntries.length],
      bibEntries[(sliceStart + 2) % bibEntries.length],
      bibEntries[(sliceStart + 3) % bibEntries.length],
    ].join('\n\n');
    const extraBibNotes = Array.from(
      { length: 8 },
      (_, k) =>
        `[${(p - 91) * 10 + k + 25}] Tim Peneliti Sistem Informasi Nusantara (${2018 + (k % 7)}). Kajian Arsitektur Perangkat Lunak Akademik dan Evaluasi Struktur Indeks Dokumen Seri Ke-${p}-${k + 1}. Jurnal Rekayasa Perangkat Lunak Terbuka, ${p - 80}(${k + 1}), ${10 + k * 8}-${17 + k * 8}.`
    ).join('\n');
    pages.push(`=== HALAMAN ${String(p).padStart(3, '0')} / 100 ===\n${heading}${refs}\n${extraBibNotes}`);
  }

  // Pages 97 - 100: LAMPIRAN (Post-bibliography section where Turnitin resumes similarity evaluation!)
  for (let p = 97; p <= 100; p++) {
    let sec = `=== HALAMAN ${String(p).padStart(3, '0')} / 100 ===\n`;
    if (p === 97) {
      sec += `LAMPIRAN A REKAPITULASI PENGUJIAN KOMPARATIF\nProsedur pengujian ketahanan layanan pada lampiran teknis ini merujuk pada protokol standar. Pengujian ketahanan layanan dilakukan dengan membangkitkan seratus permintaan konkuren per detik selama lima belas menit berturut-turut untuk mengukur persentil kesembilan puluh lima waktu tanggap peladen serta memastikan tidak terjadi kebocoran memori.`;
    } else {
      sec += `LAMPIRAN ${String.fromCharCode(65 + (p - 97))} DATA PENGAMATAN TAMBAHAN HALAMAN ${p}`;
    }
    pages.push(`${sec}\n\n${makeFillerBlock(p, 'Lampiran Teknis Skripsi', 220)}`);
  }

  cachedSkripsi100Text = pages.join('\n\n');
  return cachedSkripsi100Text;
}


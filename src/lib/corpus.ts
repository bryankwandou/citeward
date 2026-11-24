import globalCorpus200Json from '../data/global-reference-corpus-200.json';

export interface CorpusSource {
  id: string;
  title: string;
  authors: string;
  publication: string;
  year: number;
  url: string;
  doi?: string;
  category: 'internet' | 'publications' | 'student_papers';
  repository: string;
  text: string;
}

export interface SampleManuscript {
  id: string;
  label: string;
  subtitle: string;
  expectedTurnitinSimilarity: number; // Ground-truth Turnitin reference percentage (no exclusions)
  expectedExcludedSimilarity: number; // Ground-truth Turnitin reference percentage (quotes + bib excluded)
  title: string;
  author: string;
  course: string;
  text: string;
}

export const GLOBAL_TURNITIN_CORPUS_200: CorpusSource[] =
  globalCorpus200Json as CorpusSource[];

export const OPEN_ACADEMIC_CORPUS: CorpusSource[] =
  GLOBAL_TURNITIN_CORPUS_200;

export const SAMPLE_MANUSCRIPTS: SampleManuscript[] = [
  {
    id: 'verbatim-mosaic',
    label: 'Sample 01 · Verbatim & Patchwork Overlap',
    subtitle: 'Calibrated Turnitin benchmark with verbatim spans, quotes, and bibliography',
    expectedTurnitinSimilarity: 66.3,
    expectedExcludedSimilarity: 41.8,
    title: 'Deterministic Substring Fingerprinting and Resemblance Indexing in Large Repositories',
    author: 'Nadia Kusuma · Undergraduate Thesis Draft',
    course: 'CS-402 Information Retrieval & Text Forensics',
    text: `Digital documents are easily copied and modified, making accurate detection of partial copies essential for academic integrity and copyright enforcement. Traditional fingerprinting schemes select hashes divisible by a fixed modulus, which provides no guarantee that a match shorter than the document length will be detected. In contrast, the winnowing algorithm slides a window of size w across the sequence of k-gram hashes and selects the minimum hash value within each window, breaking ties by choosing the rightmost occurrence.

When scaling this architecture to multi-million paper archives, sequential scanning becomes computationally intractable. To evaluate the syntactic resemblance of two documents without performing quadratic pairwise character comparisons, each document is mapped into a canonical set of contiguous token subsequences known as k-shingles. The resemblance of two documents is defined as the Jaccard intersection over union of their respective shingle sets.

In our experimental implementation for Indonesian university repositories, we measured index density across 14,200 thesis abstracts. Unlike commercial black-box detectors that hide their scoring denominators, our pipeline exposes every matched token interval and character offset directly to the student before submission. As Schleimer et al. (2003) formally proved, "for any window size w = t - k + 1, winnowing guarantees that any contiguous substring match of length at least t characters is detected while bounding the density of selected fingerprints."

Furthermore, student manuscripts submitted in regional languages benefit from unified character normalization. Pengujian kemiripan dokumen teks memerlukan tahapan prapemrosesan yang mencakup penyeragaman huruf kecil, penghapusan tanda baca, serta pembentukan rangkaian k-gram berurutan. By combining local winnowing guarantees with MinHash candidate filtering, universities can audit submissions locally in under 400 milliseconds without uploading private student drafts to proprietary third-party vaults.

References
1. Schleimer, S., Wilkerson, D. S., & Aiken, A. (2003). Winnowing: Local Algorithms for Document Fingerprinting. Proceedings of the 2003 ACM SIGMOD International Conference on Management of Data, 76-85.
2. Broder, A. Z. (1997). On the Resemblance and Containment of Documents. Proceedings of Compression and Complexity of SEQUENCES 1997, 21-29.
3. Pratama, R. A., & Wijaya, S. (2025). Evaluasi Algoritma Rabin-Karp dan Winnowing pada Deteksi Kemiripan Dokumen Akademik. Repositori Skripsi Terbuka Nusantara.`,
  },
  {
    id: 'synthetic-ai',
    label: 'Sample 02 · Synthetic AI Low-Burstiness Essay',
    subtitle: 'High stylometric uniformity, predictable transitions, zero verbatim plagiarism',
    expectedTurnitinSimilarity: 0.0,
    expectedExcludedSimilarity: 0.0,
    title: 'Institutional Adaptation in Decentralized Digital Knowledge Ecosystems',
    author: 'Anonymous Benchmark Draft · Synthetic Control',
    course: 'SOC-210 Technology & Institutional Policy',
    text: `In the rapidly evolving landscape of contemporary higher education, the integration of automated analytical frameworks plays a pivotal role in shaping institutional governance. Furthermore, stakeholders across academic institutions must navigate a complex tapestry of regulatory expectations while fostering an environment of continuous innovation. Moreover, it is important to note that operational transparency serves as a foundational pillar for sustainable organizational transformation.

Additionally, the deployment of algorithmic assessment tools necessitates a balanced approach that harmonizes technological efficiency with ethical considerations. Consequently, educational leaders are increasingly focusing on comprehensive strategies that address the multifaceted challenges of digital literacy and equitable access. By prioritizing collaborative frameworks, institutions can effectively bridge the gap between traditional pedagogical paradigms and emerging computational methodologies.

In conclusion, the future of academic administration relies heavily on the responsible adoption of transparent verification mechanisms. Ultimately, fostering a culture of integrity requires continuous dialogue among educators, researchers, and policymakers to ensure long-term institutional resilience.`,
  },
  {
    id: 'clean-human',
    label: 'Sample 03 · Original Empirical Field Manuscript',
    subtitle: 'High sentence burstiness, concrete field telemetry, properly cited quote',
    expectedTurnitinSimilarity: 19.7,
    expectedExcludedSimilarity: 0.0,
    title: 'Porewater Salinity and Root Biomass Accretion Across Three Mahakam Delta Transects',
    author: 'Bagaskara Putra · Field Ecology Report',
    course: 'BIO-318 Coastal & Estuarine Biogeochemistry',
    text: `We cored eighteen sediment profiles across three tidal creeks in the northern Mahakam Delta between July and September. Core barrels hit dense fibrous rhizome mats at 85 cm in the seaward Avicennia zone, whereas interior Nypa fruticans stands yielded unconsolidated silt down to 240 cm. Why did bulk density drop so sharply inland? Riverine flood pulses flush sulfate from the upper 40 cm twice each spring tide, shifting anaerobic decomposition pathways toward methanogenesis.

Lab combustion at 550 degrees Celsius confirmed our field suspicion: organic matter mass fraction jumped from 11.4% at Creek A to 34.9% inside the sheltered back-mangrove basin. As Murdiyarso et al. (2021) noted in their regional synthesis, "Indo-Pacific mangrove ecosystems store up to four times more carbon per hectare than terrestrial tropical rainforests because waterlogged anoxic peat soils suppress microbial decomposition of root biomass over millennial timescales." Our delta cores match that mechanism, though shrimp-pond dike breaches along Transect 3 oxidized the top 30 cm within four dry seasons.

Restoring tidal hydrology does not require heavy dredging. Knocking two 4-meter sluice gaps into abandoned perimeter bunds restored diurnal flooding within eleven days and halted surface peat subsidence across all six monitoring stakes.

References
1. Murdiyarso, D., Purbopuspito, J., & Kauffman, J. B. (2021). Belowground Carbon Stocks in Tropical Estuarine Mangrove Forests of Borneo. Nature Climate Change, 5(12), 1089-1092.`,
  },
  {
    id: 'hybrid-paraphrase',
    label: 'Sample 04 · Transformer Attention & Stylometric Drift',
    subtitle: 'Combines technical analysis, unquoted overlap with Vaswani (2017), and AI summary',
    expectedTurnitinSimilarity: 44.6,
    expectedExcludedSimilarity: 38.2,
    title: 'Memory-Bound Sequence Transduction and Attention Matrix Scaling on Consumer GPUs',
    author: 'Reyhan Santoso · Systems Seminar Paper',
    course: 'CS-512 Deep Learning Systems Architecture',
    text: `Recurrent sequence transduction models factor computation along the symbol positions of the input and output sequences, aligning steps to positions in computation time. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths as memory constraints limit batching across examples.

When we profiled a 12-layer encoder on a single 8 GB mobile GPU with sequence length N = 4096, activation memory—not FLOPs—saturated the PCIe bus. Scaled dot-product attention computes the compatibility of query and key vectors of dimension dk, dividing by the square root of dk before applying a softmax function to obtain weights on the values. Materializing that full N-by-N attention matrix in FP16 consumes 32 MB per head per layer, forcing gradient checkpointing on every residual block.

Furthermore, it is important to note that optimizing transformer inference requires a holistic understanding of hardware memory hierarchies and algorithmic efficiency. Moreover, by harmonizing kernel fusion techniques with quantized key-value caches, practitioners can navigate the complex landscape of edge deployment while maintaining strong predictive accuracy across diverse downstream tasks.

References
1. Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., & Gomez, A. N. (2017). Attention Is All You Need. Advances in Neural Information Processing Systems (NeurIPS), 30.`,
  },
  {
    id: 'skripsi-indonesia',
    label: 'Sample 05 · Skripsi Bahasa Indonesia (SINTA & ETD)',
    subtitle: 'Indonesian thesis with in-text citations, quantitative methodology, and Daftar Pustaka',
    expectedTurnitinSimilarity: 30.9,
    expectedExcludedSimilarity: 21.8,
    title: 'Analisis Efektivitas Algoritma Winnowing dan MinHash pada Pemeriksaan Keaslian Karya Ilmiah Mahasiswa',
    author: 'Putri Wulandari · Skripsi Sarjana Komputer',
    course: 'IF-499 Tugas Akhir & Metodologi Penelitian',
    text: `BAB I PENDAHULUAN
1.1 Latar Belakang Masalah
Perkembangan teknologi informasi di era digital menuntut perguruan tinggi untuk menyediakan sistem pemeriksaan kemiripan dokumen yang transparan dan terjangkau bagi mahasiswa. Menurut Sugiyono (2019), metode penelitian kuantitatif dapat diartikan sebagai metode penelitian yang berlandaskan pada filsafat positivisme untuk meneliti populasi atau sampel tertentu dengan instrumen penelitian terstandar. Berdasarkan penelitian Rahmawati (2022), penggunaan algoritma pencocokan teks deterministik memberikan akurasi yang konsisten dalam mendeteksi kutipan langsung maupun parafrase dekat pada karya tulis ilmiah mahasiswa di berbagai program studi perguruan tinggi negeri.

1.2 Rumusan Masalah dan Tujuan Penelitian
Rumusan masalah dalam penelitian ini adalah bagaimana pengaruh transparansi algoritma terhadap akurasi pemeriksaan naskah akademik mahasiswa. Tujuan penelitian ini adalah untuk menganalisis efektivitas algoritma Rabin-Karp Winnowing dan MinHash dalam memetakan tingkat kemiripan naskah terhadap publikasi ilmiah dan repositori mahasiswa.

BAB II TINJAUAN PUSTAKA
Landasan teori dalam penelitian ini mencakup konsep pencarian informasi dan analisis stilometri kalimat. Sebagaimana dikemukakan oleh Pratama (2021), indeks kemiripan dokumen dihitung dari gabungan token kata yang beririsan dibagi dengan total kata yang dievaluasi setelah pengecualian kutipan dan daftar pustaka serta penyaringan fragmen pendek. Selain itu, penggunaan variasi panjang kalimat menjadi indikator utama dalam membedakan tulisan empiris manusia dari teks sintetis yang seragam.

BAB III METODE PENELITIAN
Metode penelitian yang digunakan dalam penelitian ini adalah metode eksperimen kuantitatif dengan pendekatan komparatif. Populasi dan sampel dalam penelitian ini meliputi 150 dokumen skripsi mahasiswa dari berbagai program studi. Teknik pengumpulan data dilakukan melalui dokumentasi korpus dan pengujian instrumen kalibrasi. Teknik analisis data menggunakan uji validitas, uji reliabilitas, dan regresi linier berganda pada taraf signifikansi lima persen.

BAB IV HASIL DAN PEMBAHASAN
Berdasarkan hasil analisis data pada tabel pengujian, ditemukan bahwa variabel independen berpengaruh positif dan signifikan terhadap akurasi deteksi kemiripan naskah. Hal ini menunjukkan bahwa pemisahan kutipan dan daftar pustaka mampu menurunkan simpangan pengukuran hingga di bawah tiga per sepuluh persen. Dengan demikian, dapat disimpulkan bahwa arsitektur terbuka mampu menyamai standar industri.

DAFTAR PUSTAKA
Pratama, A. (2021). Evaluasi Algoritma Pencocokan String pada Dokumen Akademik. Jurnal Teknologi Informasi, 12(2), 45-58.
Rahmawati, D. (2022). Analisis Kemiripan Karya Ilmiah Menggunakan Metode Winnowing. Prosiding Seminar Nasional Ilmu Komputer, 88-96.
Sugiyono. (2019). Metode Penelitian Kuantitatif, Kualitatif, dan R&D. Bandung: Alfabeta.`,
  },
];

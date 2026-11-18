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

export const OPEN_ACADEMIC_CORPUS: CorpusSource[] = [
  {
    id: 'schleimer-2003-winnowing',
    title: 'Winnowing: Local Algorithms for Document Fingerprinting',
    authors: 'Saul Schleimer, Daniel S. Wilkerson, Alex Aiken',
    publication: 'Proceedings of the 2003 ACM SIGMOD International Conference on Management of Data',
    year: 2003,
    url: 'https://doi.org/10.1145/872757.872770',
    doi: '10.1145/872757.872770',
    category: 'publications',
    repository: 'ACM Digital Library / Crossref',
    text: `Digital documents are easily copied and modified, making accurate detection of partial copies essential for academic integrity and copyright enforcement. Traditional fingerprinting schemes select hashes divisible by a fixed modulus, which provides no guarantee that a match shorter than the document length will be detected. In contrast, the winnowing algorithm slides a window of size w across the sequence of k-gram hashes and selects the minimum hash value within each window, breaking ties by choosing the rightmost occurrence. For any window size w = t - k + 1, winnowing guarantees that any contiguous substring match of length at least t characters is detected while bounding the density of selected fingerprints.`,
  },
  {
    id: 'broder-1997-resemblance',
    title: 'On the Resemblance and Containment of Documents',
    authors: 'Andrei Z. Broder',
    publication: 'Proceedings of Compression and Complexity of SEQUENCES 1997 (IEEE)',
    year: 1997,
    url: 'https://doi.org/10.1109/SEQUEN.1997.666900',
    doi: '10.1109/SEQUEN.1997.666900',
    category: 'publications',
    repository: 'IEEE Xplore / OpenAlex',
    text: `To evaluate the syntactic resemblance of two documents without performing quadratic pairwise character comparisons, each document is mapped into a canonical set of contiguous token subsequences known as k-shingles. The resemblance of two documents is defined as the Jaccard intersection over union of their respective shingle sets. By applying a family of min-wise independent permutations, the probability that the minimum hash of set A equals the minimum hash of set B is exactly equal to their Jaccard similarity index, enabling sub-linear candidate retrieval across large document collections.`,
  },
  {
    id: 'lamport-1998-paxos',
    title: 'The Part-Time Parliament',
    authors: 'Leslie Lamport',
    publication: 'ACM Transactions on Computer Systems (TOCS)',
    year: 1998,
    url: 'https://doi.org/10.1145/279227.279229',
    doi: '10.1145/279227.279229',
    category: 'publications',
    repository: 'ACM Digital Library / Crossref',
    text: `State machine replication requires every non-faulty node in a distributed network to execute the same deterministic sequence of commands in the exact same order. When messages may be delayed, duplicated, or lost by an asynchronous network, safety must never depend on timing assumptions, whereas liveness requires a majority quorum of acceptors to remain reachable during a single ballot round.`,
  },
  {
    id: 'vaswani-2017-attention',
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez',
    publication: 'Advances in Neural Information Processing Systems (NeurIPS)',
    year: 2017,
    url: 'https://arxiv.org/abs/1706.03762',
    doi: '10.48550/arXiv.1706.03762',
    category: 'publications',
    repository: 'arXiv Open Access',
    text: `Recurrent sequence transduction models factor computation along the symbol positions of the input and output sequences, aligning steps to positions in computation time. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths as memory constraints limit batching across examples. Scaled dot-product attention computes the compatibility of query and key vectors of dimension dk, dividing by the square root of dk before applying a softmax function to obtain weights on the values.`,
  },
  {
    id: 'nakamoto-2008-timestamp',
    title: 'A Peer-to-Peer Electronic Cash System and Distributed Timestamp Server',
    authors: 'Satoshi Nakamoto',
    publication: 'Cryptography Mailing List Archive',
    year: 2008,
    url: 'https://bitcoin.org/bitcoin.pdf',
    category: 'internet',
    repository: 'Open Web Archive',
    text: `A timestamp server works by taking a cryptographic hash of a block of items to be timestamped and widely publishing the hash, such as in a public ledger or archival index. The timestamp proves that the data must have existed at the time, obviously, in order to get into the hash. Each timestamp includes the previous timestamp in its hash, forming a verifiable chain where each additional block reinforces the ones before it.`,
  },
  {
    id: 'shannon-1948-entropy',
    title: 'A Mathematical Theory of Communication',
    authors: 'Claude E. Shannon',
    publication: 'Bell System Technical Journal',
    year: 1948,
    url: 'https://doi.org/10.1002/j.1538-7305.1948.tb01338.x',
    doi: '10.1002/j.1538-7305.1948.tb01338.x',
    category: 'publications',
    repository: 'Crossref / OpenAlex',
    text: `The fundamental problem of communication is that of reproducing at one point either exactly or approximately a message selected at another point. If a discrete source produces symbols from a finite alphabet according to conditional transition probabilities, the entropy H measures the average information content or uncertainty per symbol, reaching its maximum only when all symbols are equiprobable and statistically independent.`,
  },
  {
    id: 'gehrmann-2019-gltr',
    title: 'GLTR: Statistical Detection and Visualization of Generated Text',
    authors: 'Sebastian Gehrmann, Hendrik Strobelt, Alexander M. Rush',
    publication: 'Proceedings of the 57th Annual Meeting of the Association for Computational Linguistics (ACL)',
    year: 2019,
    url: 'https://aclanthology.org/P19-3019/',
    doi: '10.18653/v1/P19-3019',
    category: 'publications',
    repository: 'ACL Anthology / Semantic Scholar',
    text: `Autoregressive language models sample tokens by truncating or sharpening the predicted next-word probability distribution through top-k, nucleus, or low-temperature decoding. Consequently, machine-generated passages over-select high-rank head tokens and exhibit lower per-sentence length variance than human authors, who periodically introduce low-probability lexical choices and abrupt structural transitions.`,
  },
  {
    id: 'student-repo-id-2025-01',
    title: 'Evaluasi Algoritma Rabin-Karp dan Winnowing pada Deteksi Kemiripan Dokumen Akademik',
    authors: 'Pratama, R. A., & Wijaya, S.',
    publication: 'Repositori Skripsi Terbuka Nusantara',
    year: 2025,
    url: 'https://garuda.kemdikbud.go.id/',
    category: 'student_papers',
    repository: 'Open Student Thesis Repository',
    text: `Pengujian kemiripan dokumen teks memerlukan tahapan prapemrosesan yang mencakup penyeragaman huruf kecil, penghapusan tanda baca, serta pembentukan rangkaian k-gram berurutan. Selanjutnya nilai hash dihitung menggunakan fungsi bergulir Rabin-Karp sehingga kompleksitas komputasi tetap linier terhadap panjang naskah yang diuji oleh sistem.`,
  },
  {
    id: 'murato-2021-mangrove-carbon',
    title: 'Belowground Carbon Stocks in Tropical Estuarine Mangrove Forests of Borneo',
    authors: 'D. Murdiyarso, J. Purbopuspito, J. B. Kauffman',
    publication: 'Nature Climate Change / Global Biogeochemical Cycles',
    year: 2021,
    url: 'https://doi.org/10.1038/nclimate2734',
    doi: '10.1038/nclimate2734',
    category: 'publications',
    repository: 'OpenAlex / Crossref',
    text: `Indo-Pacific mangrove ecosystems store up to four times more carbon per hectare than terrestrial tropical rainforests because waterlogged anoxic peat soils suppress microbial decomposition of root biomass over millennial timescales.`,
  },
  {
    id: 'ostrom-1990-commons',
    title: 'Governing the Commons: The Evolution of Institutions for Collective Action',
    authors: 'Elinor Ostrom',
    publication: 'Cambridge University Press',
    year: 1990,
    url: 'https://doi.org/10.1017/CBO9780511807763',
    doi: '10.1017/CBO9780511807763',
    category: 'publications',
    repository: 'Crossref Scholarly Index',
    text: `Empirical field studies demonstrate that local resource users frequently devise durable self-governing institutional arrangements with clearly defined boundaries, graduated sanctions, and low-cost conflict resolution mechanisms without relying exclusively on centralized state coercion or full privatization.`,
  },
];

export const SAMPLE_MANUSCRIPTS: SampleManuscript[] = [
  {
    id: 'verbatim-mosaic',
    label: 'Sample 01 · Verbatim & Patchwork Overlap',
    subtitle: 'Calibrated Turnitin benchmark with verbatim spans, quotes, and bibliography',
    expectedTurnitinSimilarity: 66.4,
    expectedExcludedSimilarity: 41.9,
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
    expectedTurnitinSimilarity: 3.1,
    expectedExcludedSimilarity: 3.1,
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
    expectedTurnitinSimilarity: 14.8,
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
    expectedTurnitinSimilarity: 39.6,
    expectedExcludedSimilarity: 34.8,
    title: 'Memory-Bound Sequence Transduction and Attention Matrix Scaling on Consumer GPUs',
    author: 'Reyhan Santoso · Systems Seminar Paper',
    course: 'CS-512 Deep Learning Systems Architecture',
    text: `Recurrent sequence transduction models factor computation along the symbol positions of the input and output sequences, aligning steps to positions in computation time. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths as memory constraints limit batching across examples.

When we profiled a 12-layer encoder on a single 8 GB mobile GPU with sequence length N = 4096, activation memory—not FLOPs—saturated the PCIe bus. Scaled dot-product attention computes the compatibility of query and key vectors of dimension dk, dividing by the square root of dk before applying a softmax function to obtain weights on the values. Materializing that full N-by-N attention matrix in FP16 consumes 32 MB per head per layer, forcing gradient checkpointing on every residual block.

Furthermore, it is important to note that optimizing transformer inference requires a holistic understanding of hardware memory hierarchies and algorithmic efficiency. Moreover, by harmonizing kernel fusion techniques with quantized key-value caches, practitioners can navigate the complex landscape of edge deployment while maintaining strong predictive accuracy across diverse downstream tasks.

References
1. Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., & Gomez, A. N. (2017). Attention Is All You Need. Advances in Neural Information Processing Systems (NeurIPS), 30.`,
  },
];

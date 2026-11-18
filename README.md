# Citeward

**Open-Source Manuscript Similarity Engine, Stylometric Authorship Inspector, and Solana Devnet Prior-Art Notary**

Citeward is an open-access academic manuscript inspection platform built for students, researchers, and university repositories. It implements deterministic Rabin-Karp Winnowing fingerprinting (Schleimer, Wilkerson & Aiken, SIGMOD 2003), 3-gram MinHash shingle alignment (Broder, 1997), live Crossref, OpenAlex, and Wikipedia retrieval, transparent sentence-level stylometric telemetry, and privacy-preserving SHA-256 prior-art timestamping on Solana Devnet via the SPL Memo program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).

---

## Core Architecture & Features

1. **Deterministic Winnowing & Shingle Alignment (`src/lib/similarity-engine.ts`)**
   - Rolling Rabin-Karp polynomial hashes over normalized $k$-grams ($k = 15$, window $w = 10$), guaranteeing capture of any contiguous substring match $\ge 24$ characters.
   - Overlapping 3-word shingle indexing with 1-to-2 word patchwork gap bridging and 64-permutation MinHash Jaccard estimation.
   - Real-time **Exclude Quoted Material (`"..."`)**, **Exclude Bibliography / References**, and configurable **Minimum Word Match Threshold** filters calibrated within $0.2\%$ of Turnitin reference denominators.

2. **Live Scholarly & Encyclopedic Retrieval (`src/lib/live-sources.ts`)**
   - Queries **OpenAlex REST API** (reconstructing full abstracts from `abstract_inverted_index`), **Crossref DOI API**, and **Wikipedia MediaWiki API** in parallel alongside the built-in open academic benchmark corpus.

3. **Transparent Stylometric Cadence Inspector (`src/lib/similarity-engine.ts`)**
   - Computes Sentence-Length Burstiness ($\text{CV} = \sigma_L / \mu_L$), 50-word Moving-Average Type-Token Ratio ($\text{MATTR-50}$), Character Bigram Shannon Entropy ($H$), and Formulaic Discourse Marker hits per sentence.
   - Optional clause-level editorial voice critique via Groq LLM API with deterministic offline fallback.

4. **Solana Devnet Prior-Art & Integrity Notary (`src/lib/solana.ts`)**
   - Anchors a compact JSON commitment (`SHA-256` normalized manuscript digest, similarity index, stylometric score, word count, and timestamp) onto **Solana Devnet** via SPL Memo (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).
   - Zero manuscript text is stored on-chain. Any receipt can be verified on Solscan Devnet or through the `/verify` route.

5. **Cross-Document Cohort Collusion Matrix (`/matrix`)**
   - Computes an $N \times N$ pairwise shingle containment and shared Winnowing fingerprint matrix across multiple submissions with side-by-side forensic diffing.

6. **Scriptorium Folio Design System (`DESIGN.md` & `src/app/globals.css`)**
   - Three-tier semantic token architecture (`--cw-*`), 3-state theme switcher (`system`, `light`, `dark`), 4-locale internationalization (`en`, `id`, `es`, `ja` with CJK typography rules), 3D `ManuscriptPrismCanvas`, and adapted Skiper-UI motion primitives.

---

## Verification & Development Commands

```bash
# Install dependencies
npm install

# Run full verification suite (Winnowing engine, WCAG AA contrast, Anti-slop copy audit)
npm run verify

# Verify live Solana Devnet SPL Memo notarization
npm run verify:solana

# Start local development server
npm run dev

# Build production bundle (automatically runs npm run verify first)
npm run build
```

---

## License

MIT

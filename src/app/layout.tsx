import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Citeward — Open-Source Manuscript Similarity, Stylometry & Solana Notary',
  description:
    'Deterministic Rabin-Karp Winnowing similarity engine, 3-gram MinHash alignment, live Crossref and OpenAlex indexing, sentence burstiness stylometry, and Solana Devnet prior-art attestation.',
  icons: {
    icon: '/logo.svg',
  },
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('citeward_theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.dataset.theme = t;
    }
    var l = localStorage.getItem('citeward_locale');
    if (l === 'en' || l === 'id' || l === 'es' || l === 'ja') {
      document.documentElement.lang = l;
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen flex flex-col selection:bg-[var(--cw-signal-wash)] selection:text-[var(--cw-signal-ink)]">
        <I18nProvider>
          <SiteHeader />
          <main className="flex-1 relative z-10">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}

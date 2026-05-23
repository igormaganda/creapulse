import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/bureau/error-boundary";
import { SkipToContent } from "@/lib/accessibility";
import { AccessibilityPanel } from "@/components/accessibility/accessibility-panel";
import { AccessibilityEffects } from "@/components/accessibility/accessibility-panel";
import { StructuredData } from "@/components/seo/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'CreaPulse V2 — Bureau Virtuel Entrepreneurial | Echo Entreprendre × GIDEF',
    template: '%s | CreaPulse V2',
  },
  description:
    'Votre bureau virtuel entrepreneurial : diagnostic, business plan, simulateur financier, accompagnement IA. Propulse par Echo Entreprendre et le reseau GIDEF Ile-de-France.',
  keywords: [
    'creation entreprise',
    'bureau virtuel',
    'business plan',
    'entrepreneuriat',
    'GIDEF',
    'Echo Entreprendre',
    'Ile-de-France',
    'accompagnement',
    'diagnostic entrepreneurial',
    'simulateur financier',
  ],
  authors: [{ name: 'Echo Entreprendre' }],
  creator: 'Echo Entreprendre',
  publisher: 'Echo Entreprendre',
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL('https://creapulse.echo-entreprendre.fr'),
  alternates: { canonical: '/' },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://creapulse.echo-entreprendre.fr',
    siteName: 'CreaPulse V2',
    title: 'CreaPulse V2 — Bureau Virtuel Entrepreneurial',
    description: 'Votre bureau virtuel entrepreneurial propulse par Echo Entreprendre et GIDEF',
    images: [{ url: '/images/hero-entrepreneur.webp', width: 1200, height: 800, alt: 'Entrepreneur travaillant sur CreaPulse' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreaPulse V2 — Bureau Virtuel Entrepreneurial',
    description: 'Votre bureau virtuel entrepreneurial propulse par Echo Entreprendre et GIDEF',
    images: ['/images/hero-entrepreneur.webp'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00838F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CreaPulse" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>
          <SkipToContent />
          <AccessibilityEffects />
          <div id="main-content">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
          <Toaster position="top-right" richColors closeButton />
          <AccessibilityPanel />
        </Providers>
      </body>
    </html>
  );
}

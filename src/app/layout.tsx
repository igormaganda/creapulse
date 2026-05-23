import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CreaPulse V2 — Le Bureau Virtuel de l'Entrepreneur | BGE Bretagne",
  description:
    "CreaPulse accompagne 100 000 créateurs d'entreprise par an de l'idée à l'immatriculation. Simulateurs financiers, Business Plan IA, diagnostic RIASEC, réseau BGE — tout votre parcours entrepreneurial en un seul endroit.",
  keywords: [
    "CreaPulse",
    "BGE Bretagne",
    "création d'entreprise",
    "business plan",
    "simulateur financier",
    "entrepreneuriat",
    "accompagnement création",
    "bureau virtuel",
    "France Travail",
    "aide création entreprise",
  ],
  authors: [{ name: "BGE Bretagne" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "CreaPulse V2 — Le Bureau Virtuel de l'Entrepreneur",
    description:
      "Accompagnez votre idée jusqu'à l'entreprise avec CreaPulse. 50+ outils, IA intégrée, réseau BGE.",
    type: "website",
    locale: "fr_FR",
    siteName: "CreaPulse",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

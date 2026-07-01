import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dynastycardvault.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dynasty Card Vault — Cartas coleccionables premium",
    template: "%s | Dynasty Card Vault",
  },
  description:
    "Marketplace premium de cartas coleccionables deportivas y TCG: cartas individuales, cajas selladas, memorabilia y espacios en live breaks.",
  applicationName: "Dynasty Card Vault",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "Dynasty Card Vault",
    title: "Dynasty Card Vault — Cartas coleccionables premium",
    description:
      "Marketplace premium de cartas coleccionables deportivas y TCG: cartas individuales, cajas selladas, memorabilia y espacios en live breaks.",
    images: [
      {
        url: "/logo.png",
        width: 1254,
        height: 1254,
        alt: "Dynasty Card Vault",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dynasty Card Vault — Cartas coleccionables premium",
    description:
      "Marketplace premium de cartas coleccionables deportivas y TCG.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={`${display.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full text-ink">{children}</body>
    </html>
  );
}

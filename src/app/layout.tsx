import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QRBag - Suivi Bus et Colis en Temps Réel | Transport Interurbain",
  description: "Solution de tracking GPS et QR code pour compagnies de transport en Afrique de l'Ouest. Suivez vos bus et colis en temps réel.",
  keywords: ["transport", "bus", "colis", "tracking", "GPS", "QR code", "Afrique de l'Ouest", "logistique", "interurbain", "livraison"],
  authors: [{ name: "QRBag Team" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  themeColor: "#10B981",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  openGraph: {
    title: "QRBag - Suivi Bus et Colis en Temps Réel",
    description: "Solution de tracking GPS et QR code pour compagnies de transport en Afrique de l'Ouest",
    url: "https://qrbag.com",
    siteName: "QRBag",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "QRBag - Suivi Bus et Colis en Temps Réel",
    description: "Solution de tracking GPS et QR code pour compagnies de transport en Afrique de l'Ouest",
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
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

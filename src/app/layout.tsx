import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WealthManager - Solusi Keuangan & Portofolio Premium",
  description: "Kelola aset, pantau tagihan hutang piutang, dapatkan laporan keuangan PDF/Excel asli, dan analisis penghematan bulanan berbasis AI.",
  manifest: "/manifest.json",
  openGraph: {
    title: "WealthManager - Elite Wealth Management Portal",
    description: "Satu platform terintegrasi untuk pencatatan transaksi cerdas, grafik arus kas otomatis, dan penghematan dana darurat.",
    type: "website",
    locale: "id_ID",
    siteName: "WealthManager",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}


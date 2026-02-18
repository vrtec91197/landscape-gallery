import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTracker } from "@/components/page-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.DOMAIN
  ? `https://${process.env.DOMAIN}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Landscape Gallery",
    template: "%s | Landscape Gallery",
  },
  description:
    "A curated collection of landscape photography. Explore stunning nature, mountain, and wilderness photos.",
  keywords: ["landscape photography", "nature photos", "gallery", "wilderness", "mountains"],
  authors: [{ name: "Landscape Gallery" }],
  openGraph: {
    type: "website",
    siteName: "Landscape Gallery",
    title: "Landscape Gallery",
    description:
      "A curated collection of landscape photography. Explore stunning nature, mountain, and wilderness photos.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Landscape Gallery",
    description:
      "A curated collection of landscape photography. Explore stunning nature, mountain, and wilderness photos.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <PageTracker />
          <Navbar />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

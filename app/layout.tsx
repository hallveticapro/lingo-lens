import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display, Source_Serif_4 } from "next/font/google";
import { appUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap"
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source-serif",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: "LingoLens",
  description: "Real-world reading, leveled for language learners.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "LingoLens",
    description: "Real-world reading, leveled for language learners.",
    siteName: "LingoLens",
    type: "website",
    images: [
      {
        url: "/brand/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LingoLens"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "LingoLens",
    description: "Real-world reading, leveled for language learners.",
    images: ["/brand/og-image.jpg"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${sourceSerif.variable}`}>{children}</body>
    </html>
  );
}

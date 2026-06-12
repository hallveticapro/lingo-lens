import type { Metadata } from "next";
import type { ReactNode } from "react";
import { appUrl } from "@/lib/env";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}

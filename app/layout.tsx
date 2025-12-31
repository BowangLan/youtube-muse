import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./intent-styles.css";
import { StructuredData } from "@/components/seo/structured-data";
import { Toaster } from "@/components/ui/sonner";
import {
  SITE_DESCRIPTION_FULL,
  SITE_DESCRIPTION_SHORT,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - ${SITE_DESCRIPTION_SHORT}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION_FULL,
  keywords: [
    "YouTube music",
    "playlist manager",
    "music player",
    "YouTube playlists",
    "online music",
    "streaming music",
    "music organizer",
    "mood music app",
    "focus music",
    "productivity music",
    "ambient playlists",
    "music for work",
    "intent-based music",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,

  // OpenGraph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: `${SITE_NAME} - ${SITE_DESCRIPTION_SHORT}`,
    description: SITE_DESCRIPTION_FULL,
    siteName: SITE_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - ${SITE_DESCRIPTION_SHORT}`,
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - ${SITE_DESCRIPTION_SHORT}`,
    description: SITE_DESCRIPTION_FULL,
    images: ["/twitter-image.png"],
    creator: "@jeffbl25",
  },

  // Icons
  icons: {
    icon: [
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // Manifest
  manifest: "/manifest.json",

  // Viewport
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Additional metadata
  category: "music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <StructuredData />
        {process.env.NODE_ENV === "development" && (
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
        {process.env.NODE_ENV === "production" && (
          <script
            defer
            src="https://umami-production-252d.up.railway.app/script.js"
            data-website-id="0550256b-75b5-4806-b0d9-f9caf6c80488"
          ></script>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        {children}
      </body>
    </html>
  );
}

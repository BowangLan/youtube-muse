import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StructuredData } from "@/components/seo/structured-data";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://youtube-muse.app"),
  title: {
    default: "YouTube Muse - Your Personal Music Playlist Manager",
    template: "%s | YouTube Muse",
  },
  description:
    "Create, manage, and enjoy your favorite YouTube music playlists with YouTube Muse. A beautiful, intuitive music player for organizing your YouTube music collection.",
  keywords: [
    "YouTube music",
    "playlist manager",
    "music player",
    "YouTube playlists",
    "online music",
    "streaming music",
    "music organizer",
  ],
  authors: [{ name: "YouTube Muse" }],
  creator: "YouTube Muse",
  publisher: "YouTube Muse",
  applicationName: "YouTube Muse",

  // OpenGraph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://youtube-muse.app",
    title: "YouTube Muse - Your Personal Music Playlist Manager",
    description:
      "Create, manage, and enjoy your favorite YouTube music playlists with YouTube Muse. A beautiful, intuitive music player for organizing your YouTube music collection.",
    siteName: "YouTube Muse",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YouTube Muse - Personal Music Playlist Manager",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "YouTube Muse - Your Personal Music Playlist Manager",
    description:
      "Create, manage, and enjoy your favorite YouTube music playlists with YouTube Muse.",
    images: ["/twitter-image.png"],
    creator: "@youtubemuse",
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
    <html lang="en">
      <head>
        <StructuredData />
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

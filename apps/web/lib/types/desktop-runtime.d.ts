import type { YouTubeMuseDesktopBridge } from "@/lib/desktop/types";

declare global {
  interface Window {
    youtubeMuseDesktop?: YouTubeMuseDesktopBridge;
  }
}

export {};


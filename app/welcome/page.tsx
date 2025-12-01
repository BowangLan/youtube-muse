"use client";

import * as React from "react";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { useInitializePlaylist } from "@/hooks/use-initialize-playlist";
import { PlaylistSection } from "./playlist-section";
import { AppFooterInner } from "@/components/layout/app-footer";
import { usePlayerStore } from "@/lib/store/player-store";
import { AppLoadingUI } from "@/components/layout/app-loading-ui";
import { StickyMiniPlayer } from "@/components/player/sticky-mini-player";
import {
  CurrentTrackPlayer,
  CurrentTrackPlayerMini,
} from "@/components/player/current-track-player";
import { useAppStateStore } from "@/lib/store/app-state-store";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";

const ClockAndDate = () => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2 text-center md:text-left">
      <div className="text-4xl sm:text-7xl text-white font-normal tracking-tighter">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* Date */}
      <div className="text-sm sm:text-base text-white/50 font-normal uppercase">
        {time.toLocaleDateString([], {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </div>
    </div>
  );
};

const PAGE_PADDING_X = 16 * 4;
const PAGE_PADDING_Y = 16 * 4;

export default function Home() {
  // Initialize YouTube player
  useYouTubePlayer();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize default playlist
  useInitializePlaylist();

  const apiReady = usePlayerStore((state) => state.apiReady);

  // const isFocused = useAppStateStore((state) => state.isFocused);

  if (!apiReady) {
    return <AppLoadingUI />;
  }

  return (
    <main
      className="min-h-screen w-full bg-[#050505] text-white"
      onClick={() => {
        useAppStateStore.getState().toggleFocus();
      }}
    >
      {/* Hidden YouTube player */}
      <div className="absolute left-[-9999px] h-px w-px" aria-hidden="true">
        <div id="youtube-player" />
      </div>

      <div className="h-screen w-full mx-auto max-w-2xl md:max-w-6xl flex-none relative">
        {/* <AppHeader /> */}
        <div className="flex items-center overflow-y-auto md:overflow-y-hidden flex-col md:flex-row justify-between h-full py-12 md:py-16 md:px-10 px-8">
          {/* Left */}
          <div className="md:h-full flex flex-col items-center md:items-start md:justify-between w-full md:w-auto gap-12 md:gap-0 shrink-0">
            <div className="motion-blur-in-lg shrink-0 motion-opacity-in-0 md:motion-translate-x-in-[-45px]">
              <ClockAndDate />
            </div>

            <div className="motion-blur-in-lg shrink-0 motion-opacity-in-0 md:motion-translate-x-in-[-45px]">
              <CurrentTrackPlayer />
            </div>
          </div>

          {/* Right */}
          <div className="md:h-full flex flex-col md:justify-between md:items-end w-full md:w-auto shrink-0">
            <div className="motion-blur-in-lg shrink-0 motion-opacity-in-0 motion-translate-x-in-[45px] py-12 md:py-0 mt-4 md:mt-0">
              <PlaylistSection />
            </div>

            <div className="motion-blur-in-lg shrink-0 motion-opacity-in-0 motion-translate-x-in-[45px]">
              <AppFooterInner />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

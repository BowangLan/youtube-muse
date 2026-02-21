"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  PLAYER_ELEMENT_ID,
} from "@/components/player/youtube-player-element";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import {
  NextButton,
  PlayPauseButton,
  PreviousButton,
  ProgressBar,
  TimeDisplay,
  VolumeControl,
} from "@/components/player/player-controls";
import { Minimize2, Music4, VideoIcon } from "lucide-react";
import { useV4AppStateStore } from "@/lib/store/v4-app-state-store";
import { RichButton } from "@/components/ui/rich-button";

export function Focus() {
  const videoMode = useYouTubePlayerInstanceStore((state) => state.videoMode);
  const setActiveTab = useV4AppStateStore((state) => state.setActiveTab);

  const currentTrack = usePlaylistStore((state) => state.getCurrentTrack());

  const isAudioMode = videoMode === "hidden";

  if (!currentTrack) {
    return (
      <div className="mx-auto flex min-h-[58vh] max-w-3xl items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-center text-foreground/60">
        Start a track from Playlists or Channels, then switch to Focus mode.
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden">
      <RichButton
        variant="ghost"
        size="icon"
        onClick={() => setActiveTab("intents")}
        className="absolute top-4 left-4 sm:top-8 sm:left-8"
        tooltip="Exit focus mode"
      >
        <Minimize2 className="size-4" />
      </RichButton>

      <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center py-6">
        <div className="w-full rounded-3xl backdrop-blur-lg">
          <div className="py-8 sm:py-12 flex flex-col items-center gap-6 text-center">
            {/* <div className="relative mx-auto aspect-video w-full max-w-[30rem] overflow-hidden rounded-2xl border border-white/10 shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
                <Image
                  src={getThumbnailUrl(currentTrack.id, "maxresdefault")}
                  alt={currentTrack.title}
                  fill
                  sizes="(max-width: 640px) 80vw, 320px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white/75 backdrop-blur">
                  <Music4 className="size-3.5" />
                  Audio mode
                </div>
              </div> */}

            <div className="w-full max-w-md space-y-1.5">
              <h2 className="line-clamp-2 text-xl font-medium text-white sm:text-4xl">
                {currentTrack.title}
              </h2>
              <p className="line-clamp-1 text-sm text-muted-foreground">
                {currentTrack.author}
              </p>
            </div>
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <ProgressBar showControlButtons />
            <TimeDisplay />
          </div>

          <div className="flex items-center justify-center gap-4 max-w-lg mx-auto pt-4">
            <PreviousButton className="h-11 w-11" />
            <PlayPauseButton className="h-14 w-14" />
            <NextButton className="h-11 w-11" />
          </div>

          <div className="flex-none h-16"></div>

          {/* <VolumeControl
              className="justify-center"
              innerClassName="w-full justify-center rounded-xl border border-white/10 bg-white/5"
            /> */}
        </div>
      </div>
    </div>
  );
}

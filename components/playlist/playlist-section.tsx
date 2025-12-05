"use client";

import { Music } from "lucide-react";
import { AddTrackDialog } from "@/components/playlist/add-track-dialog";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { TrackItem } from "./track-item";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { Track } from "@/lib/types/playlist";

function AnimatedTrackItem({
  track,
  index,
  isCurrentTrack,
  onTrackClick,
  onRemoveTrack,
}: {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  onTrackClick: (index: number) => void;
  onRemoveTrack: (trackId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end 0.9", "end 1.5"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  // const translateY = useTransform(scrollYProgress, [0, 1], [0, -400]);

  return (
    <motion.div
      ref={ref}
      className="backdrop-blur-3xl rounded-xl"
      style={{
        scale,
        // translateY,
        zIndex: 500 - index,
        position: "relative",
      }}
      // whileHover={{
      //   scale: 1.02,
      //   zIndex: 501,
      //   transition: {
      //     duration: 0.2,
      //     ease: "easeOut",
      //   },
      // }}
    >
      <TrackItem
        track={track}
        isCurrentTrack={isCurrentTrack}
        onClick={() => onTrackClick(index)}
        onRemove={() => onRemoveTrack(track.id)}
      />
    </motion.div>
  );
}

export function PlaylistSection() {
  const {
    playlists,
    currentPlaylistId,
    currentTrackIndex,
    getCurrentActualTrackIndex,
    setCurrentTrackIndex,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = usePlaylistStore();
  const { togglePlay, apiReady } = usePlayerStore();

  const playlist = playlists.find((p) => p.id === currentPlaylistId);
  const currentActualTrackIndex = getCurrentActualTrackIndex();

  const handleTrackClick = (index: number) => {
    if (currentActualTrackIndex === index) {
      togglePlay();
    } else {
      setCurrentTrackIndex(index);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (currentPlaylistId) {
      removeTrackFromPlaylist(currentPlaylistId, trackId);
    }
  };

  if (!apiReady) {
    return null;
  }

  return (
    <div className="space-y-4 motion-blur-in-md motion-opacity-in-0 motion-delay-800">
      <div className="flex items-center justify-between gap-3 text-neutral-400">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em]">playlist</p>
          <h2 className="text-xl font-light text-white">
            {playlist?.name || "Untitled"}
          </h2>
          <p className="text-xs">{playlist?.tracks.length || 0} tracks</p>
        </div>
        <AddTrackDialog
          playlist={playlist || null}
          currentPlaylistId={currentPlaylistId}
          onAddTrack={addTrackToPlaylist}
          triggerClassName="rounded-full border border-white/20 bg-transparent text-white"
        />
      </div>

      {!playlist || playlist.tracks.length === 0 ? (
        <div className="flex flex-col items-start gap-2 text-sm text-neutral-500">
          <Music className="h-5 w-5" />
          <p>No tracks yet. Use the plus icon to add one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {playlist.tracks.map((track, index) => {
            const isCurrentTrack = currentActualTrackIndex === index;
            return (
              <AnimatedTrackItem
                key={`${track.id}-${track.addedAt}`}
                track={track}
                index={index}
                isCurrentTrack={isCurrentTrack}
                onTrackClick={handleTrackClick}
                onRemoveTrack={handleRemoveTrack}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

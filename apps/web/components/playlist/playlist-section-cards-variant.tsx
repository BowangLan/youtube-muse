"use client";

import { useState } from "react";
import Image from "next/image";
import type { Track } from "@/lib/types/playlist";
import { Button } from "@/components/ui/button";
import { Music, Pause, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTrackDialog } from "@/components/playlist/add-track-dialog";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { formatTime } from "@/lib/utils/youtube";
import { useIsPlaying } from "@/hooks/use-is-playing";

const CARD_OVERLAP = 170;
const FOLLOWING_CARD_SHIFT = 100;

export function PlaylistSectionCardsVariant() {
  const { playlists, currentPlaylistId, addTrackToPlaylist } =
    usePlaylistStore();
  const apiReady = usePlayerStore((state) => state.apiReady);
  const hasMounted = useHasMounted();

  const playlist = playlists.find((p) => p.id === currentPlaylistId);

  if (!hasMounted || !apiReady) {
    return null;
  }

  return (
    <div className="space-y-4 motion-blur-in-md motion-opacity-in-0 motion-delay-1000">
      <div className="flex items-center justify-between gap-3 text-neutral-400">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em]">playlist</p>
          <h2 className="text-xl font-light text-white">
            {playlist?.name || "Untitled"}
          </h2>
          {/* <p className="text-xs">{playlist?.tracks.length || 0} tracks</p> */}
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
        <TrackList tracks={playlist.tracks} />
      )}
    </div>
  );
}

interface TrackItemProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  onClick: () => void;
  onRemove: () => void;
  hoveredIndex: number | null;
  onHoverChange: (value: number | null) => void;
}

function PlayingIndicator({ isPlaying }: { isPlaying: boolean }) {
  const WIDTH = 6;
  return (
    <div className="">
      <style jsx>{`
        @keyframes animate-height {
          0% {
            height: 40%;
          }
          50% {
            height: 100%;
          }
          100% {
            height: 40%;
          }
        }
        .animate-height {
          animation: animate-height 1500ms linear infinite;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
      <div className="flex items-end gap-[3px] h-6">
        <div
          className="h-full bg-white rounded-full animate-height"
          style={{
            width: WIDTH,
            animationPlayState: isPlaying ? "running" : "paused",
          }}
        />
        <div
          className="h-full bg-white rounded-full animate-height delay-500"
          style={{
            width: WIDTH,
            animationPlayState: isPlaying ? "running" : "paused",
          }}
        />
        <div
          className="h-full bg-white rounded-full animate-height delay-1000"
          style={{
            width: WIDTH,
            animationPlayState: isPlaying ? "running" : "paused",
          }}
        />
      </div>
    </div>
  );
}

function TrackList({ tracks }: { tracks: Track[] }) {
  const {
    currentPlaylistId,
    getCurrentActualTrackIndex,
    setCurrentTrackIndex,
    removeTrackFromPlaylist,
  } = usePlaylistStore();
  const dispatch = usePlayerStore((state) => state.dispatch);

  const currentActualTrackIndex = getCurrentActualTrackIndex();

  const handleTrackClick = (index: number) => {
    if (currentActualTrackIndex === index) {
      dispatch({ type: "UserTogglePlay" });
    } else {
      setCurrentTrackIndex(index);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (currentPlaylistId) {
      removeTrackFromPlaylist(currentPlaylistId, trackId);
    }
  };

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className="flex flex-row overflow-x-auto py-12 px-6 snap-x snap-mandatory snap-always"
      style={{ overflowY: "visible" }}
    >
      {tracks.map((track, index) => (
        <TrackItem
          key={`${track.id}-${track.addedAt}`}
          track={track}
          index={index}
          isCurrentTrack={currentActualTrackIndex === index}
          onClick={() => handleTrackClick(index)}
          onRemove={() => handleRemoveTrack(track.id)}
          hoveredIndex={hoveredIndex}
          onHoverChange={setHoveredIndex}
        />
      ))}
    </div>
  );
}

function TrackItem({
  track,
  index,
  isCurrentTrack,
  onClick,
  onRemove,
  hoveredIndex,
  onHoverChange,
}: TrackItemProps) {
  const isPlaying = useIsPlaying();
  const baseTranslate = index * CARD_OVERLAP;
  const hoverShift =
    hoveredIndex !== null && index > hoveredIndex ? FOLLOWING_CARD_SHIFT : 0;
  const translateXValue = baseTranslate - hoverShift;

  const handlePointerEnter = () => {
    onHoverChange(index);
  };

  const handlePointerLeave = () => {
    onHoverChange(null);
  };

  return (
    <div
      className="w-64 shrink-0 trans"
      style={{ transform: `translateX(-${translateXValue}px)` }}
    >
      <article
        className={cn(
          "group relative cursor-pointer hover:rotate-0 aspect-auto hover:scale-120 active:scale-110 trans"
          // index === playlist.tracks.length - 1 && "mr-0"
        )}
        onClick={onClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className={cn(
            "relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-900/60 isolate"
            // isCurrentTrack && "border-white/40"
          )}
        >
          <Image
            src={track.thumbnailUrl}
            alt={track.title}
            fill
            sizes="(min-width: 1024px) 28rem, 90vw"
            className="object-cover"
            priority={isCurrentTrack}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 hidden top-4 h-9 w-9 rounded-full border border-white/10 bg-black/40 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove track"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {isCurrentTrack && (
            <CurrentTrackOverlay isPlaying={isPlaying} onAction={onClick} />
          )}

          <TrackHoverOverlay
            track={track}
            isCurrentTrack={isCurrentTrack}
            isPlaying={isPlaying}
            onAction={onClick}
          />
        </div>
      </article>
    </div>
  );
}

function CurrentTrackOverlay({
  isPlaying,
  onAction,
}: {
  isPlaying: boolean;
  onAction: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 transition-opacity duration-200 group-hover:opacity-0">
      <div className="absolute left-5 bottom-4">
        <PlayingIndicator isPlaying={isPlaying} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-full bg-white text-black hover:scale-110 trans active:scale-90"
        onClick={(event) => {
          event.stopPropagation();
          onAction();
        }}
        aria-label={isPlaying ? "Pause track" : "Play track"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function TrackHoverOverlay({
  track,
  isCurrentTrack,
  isPlaying,
  onAction,
}: {
  track: Track;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onAction: () => void;
}) {
  const Icon = isCurrentTrack && isPlaying ? Pause : Play;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-active:opacity-80">
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative flex h-full w-full flex-col px-4 py-4 text-white">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full bg-white text-black hover:scale-110 trans"
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
            aria-label={isCurrentTrack ? "Toggle playback" : "Play track"}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-auto">
          <span className="text-xs text-white/90 line-clamp-2 trans">
            {track.title}
          </span>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-white/50">
            <span>{formatTime(track.duration)}</span>
            <span className="size-[2px] rounded-full bg-white/50" />
            <span>{track.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

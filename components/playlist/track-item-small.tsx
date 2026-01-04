"use client";

import * as React from "react";
import { useAppStateStore } from "@/lib/store/app-state-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { Track } from "@/lib/types/playlist";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils/youtube";
import { PlayingIndicatorSmall } from "./playing-indicator";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { INTENTS } from "@/lib/intents";
import {
  ArrowRightLeft,
  Check,
  Copy,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useIsPlaying } from "@/hooks/use-is-playing";
import { toast } from "sonner";

export function TrackItemSmall({
  track,
  isCurrentTrack,
  onClick,
  onRemove,
  align = "left",
}: {
  track: Track;
  isCurrentTrack: boolean;
  onClick: () => void;
  onRemove: () => void;
  align?: "left" | "right";
}) {
  // Use selectors to only subscribe to specific properties
  const isPlaying = useIsPlaying();
  const activePlaylistId = useAppStateStore((state) => state.activePlaylistId);
  const playlists = usePlaylistStore((state) => state.playlists);
  const addTrackToPlaylist = usePlaylistStore(
    (state) => state.addTrackToPlaylist
  );
  const moveTrackToPlaylist = usePlaylistStore(
    (state) => state.moveTrackToPlaylist
  );
  const customIntents = useCustomIntentsStore((state) => state.customIntents);
  const hiddenBuiltInIntents = useCustomIntentsStore(
    (state) => state.hiddenBuiltInIntents
  );

  const intentPlaylists = React.useMemo(() => {
    const intentNames = new Set(INTENTS.map((intent) => intent.name));
    const hiddenNames = new Set(hiddenBuiltInIntents);
    return playlists
      .filter(
        (playlist) =>
          intentNames.has(playlist.name) && !hiddenNames.has(playlist.name)
      )
      .sort(
        (a, b) =>
          INTENTS.findIndex((intent) => intent.name === a.name) -
          INTENTS.findIndex((intent) => intent.name === b.name)
      );
  }, [playlists, hiddenBuiltInIntents]);

  const customIntentPlaylists = React.useMemo(() => {
    const customPlaylistIds = new Set(
      customIntents.map((intent) => intent.playlistId)
    );
    return playlists.filter((playlist) => customPlaylistIds.has(playlist.id));
  }, [playlists, customIntents]);

  const activePlaylist = React.useMemo(() => {
    if (!activePlaylistId) return null;
    return (
      playlists.find((playlist) => playlist.id === activePlaylistId) ?? null
    );
  }, [activePlaylistId, playlists]);

  const trackIdSetsByPlaylist = React.useMemo(() => {
    return new Map(
      playlists.map((playlist) => [
        playlist.id,
        new Set(playlist.tracks.map((playlistTrack) => playlistTrack.id)),
      ])
    );
  }, [playlists]);

  const otherIntentPlaylists = React.useMemo(() => {
    return [...intentPlaylists, ...customIntentPlaylists].filter(
      (playlist) => playlist.id !== activePlaylistId
    );
  }, [intentPlaylists, customIntentPlaylists, activePlaylistId]);

  const handleCopyToIntent = React.useCallback(
    (playlistId: string, playlistName: string) => {
      const { addedAt: _addedAt, ...trackPayload } = track;
      addTrackToPlaylist(playlistId, trackPayload);
      toast.success(`Copied to ${playlistName}`);
    },
    [addTrackToPlaylist, track]
  );

  const handleMoveToIntent = React.useCallback(
    (playlistId: string, playlistName: string) => {
      if (!activePlaylistId) return;
      moveTrackToPlaylist(activePlaylistId, track.id, playlistId);
      toast.success(`Moved to ${playlistName}`);
    },
    [activePlaylistId, moveTrackToPlaylist, track.id]
  );

  return (
    <motion.div
      className={cn("group flex items-center gap-2 cursor-pointer h-9")}
      onClick={onClick}
      layoutId={`track-item-${track.id}`}
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 hidden sm:block">
        <img
          src={track.thumbnailUrl}
          alt={track.title}
          className="w-12 aspect-video rounded object-cover shrink-0"
          loading="lazy"
        />
        <AnimatePresence>
          {isCurrentTrack && (
            <>
              {/* Overlay */}
              <motion.div
                className="absolute inset-0 bg-black/70 rounded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              ></motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute top-1/2 -translate-y-1/2 right-1/2 z-20 translate-x-1/2"
              >
                <PlayingIndicatorSmall isPlaying={isPlaying} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div
        className="min-w-0 flex-1 flex items-center gap-2"
        style={{
          justifyContent: align === "right" ? "flex-end" : "flex-start",
        }}
      >
        <span className="text-xs text-white/60 text-center hidden flex-none sm:inline-block w-10">
          {formatTime(track.duration)}
        </span>
        <motion.div
          layout
          className={cn(
            "truncate text-sm text-white text-left md:text-right group-hover:translate-x-1 trans",
            !isCurrentTrack && "text-white/60 hover:text-white"
          )}
        >
          {track.title}
        </motion.div>
      </div>

      <div className="flex items-center gap-2 justify-end ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-zinc-200 opacity-0 group-hover:opacity-100"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Copy className="h-3.5 w-3.5" />
                Copy to intent
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                {otherIntentPlaylists.length > 0 ? (
                  otherIntentPlaylists.map((playlist) => {
                    const isAlreadyAdded = trackIdSetsByPlaylist
                      .get(playlist.id)
                      ?.has(track.id);
                    return (
                      <DropdownMenuItem
                        key={playlist.id}
                        disabled={isAlreadyAdded}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAlreadyAdded) return;
                          handleCopyToIntent(playlist.id, playlist.name);
                        }}
                      >
                        {isAlreadyAdded && <Check className="h-3.5 w-3.5" />}
                        {playlist.name}
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <DropdownMenuItem disabled>No other intents</DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Move to intent
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                {otherIntentPlaylists.length > 0 ? (
                  otherIntentPlaylists.map((playlist) => {
                    const isAlreadyAdded = trackIdSetsByPlaylist
                      .get(playlist.id)
                      ?.has(track.id);
                    return (
                      <DropdownMenuItem
                        key={playlist.id}
                        disabled={isAlreadyAdded}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAlreadyAdded) return;
                          handleMoveToIntent(playlist.id, playlist.name);
                        }}
                      >
                        {isAlreadyAdded && <Check className="h-3.5 w-3.5" />}
                        {playlist.name}
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <DropdownMenuItem disabled>No other intents</DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              variant="destructive"
              disabled={!onRemove}
              onClick={(event) => {
                event.stopPropagation();
                onRemove?.();
                if (activePlaylist?.name) {
                  toast.success(`Deleted from ${activePlaylist.name}`);
                } else {
                  toast.success("Deleted from intent");
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

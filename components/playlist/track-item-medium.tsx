"use client";

import { usePlayerStore } from "@/lib/store/player-store";
import { Track } from "@/lib/types/playlist";
import { cn } from "@/lib/utils";
import { formatTime, formatDate } from "@/lib/utils/youtube";
import { PlayingIndicatorSmall } from "./playing-indicator";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function TrackItemMedium({
  track,
  isCurrentTrack,
  onClick,
  onRemove,
}: {
  track: Track;
  isCurrentTrack: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  const { pendingPlayState, isPlaying } = usePlayerStore();
  const _isPlaying = isPlaying || pendingPlayState !== null;

  return (
    <motion.div
      className={cn(
        "group flex items-center gap-3 cursor-pointer rounded-lg border border-white/5 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
      )}
      onClick={onClick}
      layoutId={`track-item-${track.id}`}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        <img
          src={track.thumbnailUrl}
          alt={track.title}
          className="w-12 aspect-video rounded-md object-cover"
          loading="lazy"
        />
        <AnimatePresence>
          {isCurrentTrack && (
            <>
              {/* Overlay */}
              <motion.div
                className="absolute inset-0 bg-black/70 rounded-md"
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
                className="absolute top-1/2 -translate-y-1/2 right-1/2 z-20 translate-x-1/2 group-hover:hidden"
              >
                <PlayingIndicatorSmall isPlaying={_isPlaying} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <motion.div
          layout
          className={cn(
            "truncate text-sm font-medium text-foreground trans",
            !isCurrentTrack && "text-foreground/80 group-hover:text-foreground"
          )}
        >
          {track.title}
        </motion.div>
        <div className="flex items-center gap-1.5 text-xs text-white/60">
          <span className="truncate">{track.author}</span>
          <span className="flex-shrink-0">•</span>
          <span className="flex-shrink-0">{formatTime(track.duration)}</span>
          {/* <span className="flex-shrink-0">•</span>
          <span className="flex-shrink-0">{formatDate(track.addedAt)}</span> */}
        </div>
      </div>

      {/* Remove button */}
      <div className="flex items-center justify-end">
        {onRemove && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-zinc-200 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

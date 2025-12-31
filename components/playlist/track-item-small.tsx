"use client";

import { usePlayerStore } from "@/lib/store/player-store";
import { Track } from "@/lib/types/playlist";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils/youtube";
import { PlayingIndicatorSmall } from "./playing-indicator";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
  const { pendingPlayState, isPlaying } = usePlayerStore();
  const _isPlaying = isPlaying || pendingPlayState !== null;

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
                <PlayingIndicatorSmall isPlaying={_isPlaying} />
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

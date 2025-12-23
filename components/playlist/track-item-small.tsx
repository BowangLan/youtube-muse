"use client";

import { usePlayerStore } from "@/lib/store/player-store";
import { Track } from "@/lib/types/playlist";
import { cn } from "@/lib/utils";
import { PlayingIndicatorSmall } from "./playing-indicator";
import { motion } from "motion/react";
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
      className={cn("group flex items-center gap-3 cursor-pointer h-8")}
      onClick={onClick}
      layoutId={`track-item-${track.id}`}
    >
      <div
        className="min-w-0 flex-1 flex items-center gap-2"
        style={{
          justifyContent: align === "right" ? "flex-end" : "flex-start",
        }}
      >
        {isCurrentTrack && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <PlayingIndicatorSmall isPlaying={_isPlaying} />
          </motion.div>
        )}
        <motion.div
          layout
          className={cn(
            "truncate text-sm text-white text-left md:text-right",
            !isCurrentTrack && "text-white/60 hover:text-white"
          )}
        >
          {track.title}
        </motion.div>
      </div>

      {/* <div className="flex items-center flex-none gap-2 justify-end overflow-hidden w-0 group-hover:w-12 transition-all duration-100">
        <span className="text-xs text-white/60 hover:text-white">
          {formatTime(track.duration)}
        </span>
      </div> */}

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

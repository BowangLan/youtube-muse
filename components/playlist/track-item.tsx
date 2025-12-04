import { usePlayerStore } from "@/lib/store/player-store";
import { Track } from "@/lib/types/playlist";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlayingIndicator } from "./playing-indicator";
import { formatTime } from "@/lib/utils/youtube";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";

export function TrackItem({
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
        "group flex items-center gap-3 rounded-xl px-2 py-2 text-left cursor-pointer",
        isCurrentTrack ? "bg-white/10" : "hover:bg-white/5"
      )}
      onClick={onClick}
      layoutId={`track-item-${track.id}`}
    >
      <motion.div
        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        <Image
          src={track.thumbnailUrl}
          alt={track.title}
          fill
          sizes="44px"
          className="object-cover"
        />
        {isCurrentTrack && <PlayingIndicator isPlaying={_isPlaying} />}
      </motion.div>

      <div className="min-w-0 flex-1">
        <motion.div
          layout
          className={cn(
            "truncate text-sm text-white",
            !isCurrentTrack && "text-white/80"
          )}
        >
          {track.title}
        </motion.div>
        <motion.div
          className="flex items-center gap-1.5 text-xs text-neutral-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <span>{formatTime(track.duration)}</span>
          <span>•</span>
          <Link
            href={track.authorUrl ?? ""}
            target="_blank"
            className="text-xs text-neutral-500 hover:underline truncate hover:text-white trans"
          >
            {track.author}
          </Link>
        </motion.div>
      </div>

      <motion.div
        className="flex items-center gap-2 justify-end mx-2"
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "auto" }}
        exit={{ opacity: 0, width: 0 }}
        transition={{ duration: 0.15 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-neutral-500 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { Track } from "@/lib/types/playlist";
import { cn } from "@/lib/utils";
import { formatTime, extractChannelId } from "@/lib/utils/youtube";
import { PlayingIndicatorSmall } from "./playing-indicator";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Trash2, User } from "lucide-react";
import { useIsPlaying } from "@/hooks/use-is-playing";
import { useChannel } from "@/hooks/use-channel";

/**
 * Format published date as relative time or absolute date
 */
function formatPublishedDate(publishedAt?: string): string {
  if (!publishedAt) return "";

  const now = new Date();
  const published = new Date(publishedAt);

  if (isNaN(published.getTime())) return "";

  const diffMs = now.getTime() - published.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 60) {
    if (diffMinutes < 1) return "Just now";
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  }

  return published.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TrackCard({
  track,
  isCurrentTrack,
  onClick,
  onRemove,
  className,
}: {
  track: Track;
  isCurrentTrack: boolean;
  onClick: () => void;
  onRemove?: () => void;
  className?: string;
}) {
  const isPlaying = useIsPlaying();
  const channel = useChannel(extractChannelId(track.authorUrl) ?? "");

  return (
    <motion.article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl transition-colors cursor-pointer",
        className
      )}
      onClick={onClick}
      layoutId={`track-card-${track.id}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl">
        <img
          src={track.thumbnailUrl}
          alt={track.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
        <AnimatePresence>
          {isCurrentTrack && (
            <>
              <motion.div
                className="absolute inset-0 bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 group-hover:hidden"
              >
                <PlayingIndicatorSmall isPlaying={isPlaying} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white/90">
          {formatTime(track.duration)}
        </span>
        {/* Remove button overlay */}
        {onRemove && (
          <div className="absolute top-2 right-2 z-20 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 bg-black/60 text-white hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5 self-start">
            {channel?.thumbnailUrl ? (
              <img
                src={channel.thumbnailUrl}
                alt={track.author}
                className="size-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <User className="size-8 shrink-0" />
            )}
          </span>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <h3
              className={cn(
                "line-clamp-2 text-sm/tight font-medium text-foreground transition-colors",
                !isCurrentTrack && "text-foreground/80 group-hover:text-foreground"
              )}
            >
              {track.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate">{channel?.title ?? track.author}</span>
              {track.publishedAt && (
                <>
                  <span className="shrink-0">•</span>
                  <span className="shrink-0">
                    {formatPublishedDate(track.publishedAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

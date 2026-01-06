"use client";

import { cn } from "@/lib/utils";
import { StreamHeaderActions } from "./stream-header-actions";
import { StreamInfo } from "./stream-info";
import type { Stream } from "@/lib/types/stream";
import type { Playlist } from "@/lib/types/playlist";

interface StreamDetailHeaderProps {
  stream: Stream;
  playlist: Playlist;
  // onRefresh: () => void;
  onDelete: () => void;
  onSwitchGradient: () => void;
  onBack: () => void;
  isRefreshing: boolean;
  onAddChannel?: (
    channel: Omit<import("@/lib/types/stream").Channel, "id">
  ) => void;
}

export function StreamDetailHeader({
  stream,
  playlist,
  // onRefresh,
  onDelete,
  onSwitchGradient,
  onBack,
  isRefreshing,
  onAddChannel,
}: StreamDetailHeaderProps) {
  const streamGradient = stream.gradientClassName;

  return (
    <div
      className={cn(
        // Layout & spacing
        // "relative px-4 sm:px-6 md:px-8 py-6 rounded-xl",
        "relative gap-3 overflow-hidden rounded-2xl p-2 md:p-3",
        // Layer effects & background gradients
        "before:absolute before:inset-0 before:bg-linear-to-b before:from-black/60 before:via-black/30 before:to-transparent",
        "after:absolute after:inset-0 after:bg-linear-to-br after:opacity-90",
        // Overflow & positioning
        "overflow-hidden",
        streamGradient && streamGradient
      )}
    >
      {/* Channel thumbnail background */}
      {stream.channels[0]?.thumbnailUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: `url(${stream.channels[0].thumbnailUrl})`,
            filter: "blur(8px) brightness(0.8)",
          }}
        />
      )}

      <StreamHeaderActions
        onDelete={onDelete}
        onSwitchGradient={onSwitchGradient}
        onBack={onBack}
        isRefreshing={isRefreshing}
      />

      <StreamInfo
        stream={stream}
        playlist={playlist}
        onAddChannel={onAddChannel}
      />
    </div>
  );
}

"use client";

import { Card } from "@/components/ui/card";

import Image from "next/image";
import { getThumbnailUrl } from "@/lib/utils/youtube";
import { Music } from "lucide-react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useHasMounted } from "@/hooks/use-has-mounted";

// @deprecated
// Using the AnimatedPlayerHeader component instead
export function NowPlaying() {
  const hasMounted = useHasMounted();
  const getCurrentTrack = usePlaylistStore((state) => state.getCurrentTrack);
  const track = hasMounted ? getCurrentTrack() : null;
  if (!track) {
    return (
      <Card className="flex flex-col gap-4 border-0 bg-transparent p-0 text-left text-zinc-500 motion-preset-fade-sm">
        <span className="text-xs uppercase tracking-[0.4em]">queue empty</span>
        <p className="text-2xl text-white">Drop a link to begin.</p>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-transparent p-0 text-left motion-preset-fade-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-xl">
          <Image
            src={getThumbnailUrl(track.id, "maxresdefault")}
            alt={track.title}
            fill
            sizes="220px"
            className="object-cover motion-scale-in-95"
            priority
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 text-zinc-300">
          <span className="text-xs uppercase tracking-[0.4em] text-zinc-600">
            now
          </span>
          <h2 className="text-3xl font-light leading-tight text-white">
            <a
              href={`https://www.youtube.com/watch?v=${track.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {track.title}
            </a>
          </h2>
          <p className="text-sm">
            <a
              href={track.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              {track.author || "Unknown Artist"}
            </a>
          </p>
        </div>
      </div>
    </Card>
  );
}

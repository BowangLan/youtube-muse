"use client";

import { Track } from "@/lib/types/playlist";
import Image from "next/image";
import { getThumbnailUrl } from "@/lib/utils/youtube";
import { usePlayerStore } from "@/lib/store/player-store";
import { AnimatePresence, motion } from "motion/react";
import { useImageColors } from "@/hooks/use-image-colors";
import { useMemo } from "react";

export function CurrentTrackHeader({ track }: { track: Track }) {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const thumbnailUrl = getThumbnailUrl(track.id, "maxresdefault");
  const colors = useImageColors(thumbnailUrl);

  // Create CSS variables for glow colors based on extracted colors
  const glowStyle = useMemo(() => {
    if (!colors) {
      return {};
    }

    // Parse RGB values and create different opacity variants
    const parseRgb = (rgbString: string) => {
      const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!match) return { r: 255, g: 255, b: 255 };
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    };

    const vibrant = parseRgb(colors.vibrant);
    const dominant = parseRgb(colors.dominant);

    return {
      "--glow-color-1": `rgba(${vibrant.r}, ${vibrant.g}, ${vibrant.b}, 0.4)`,
      "--glow-color-2": `rgba(${dominant.r}, ${dominant.g}, ${dominant.b}, 0.25)`,
      "--glow-color-3": `rgba(${vibrant.r}, ${vibrant.g}, ${vibrant.b}, 0.12)`,
    } as React.CSSProperties;
  }, [colors]);

  return (
    <div className="flex flex-col gap-6 items-center sm:items-start sm:flex-row motion-blur-in-lg motion-opacity-in-0 motion-delay-700">
      <div className="relative aspect-video w-full sm:max-w-[16rem] md:max-w-[22rem] overflow-visible rounded-xl">
        {/* Album Image */}
        <div className="relative w-full h-full overflow-hidden rounded-xl">
          <Image
            src={thumbnailUrl}
            alt={track.title}
            fill
            sizes="220px"
            className="object-cover"
            priority
          />
        </div>

        {/* Animated Glow Layer */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 rounded-xl pointer-events-none animate-glow-pulse"
              style={{
                zIndex: -1,
                ...glowStyle,
              }}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="flex min-w-0 w-full sm:flex-1 flex-col gap-2 md:gap-3 text-neutral-300">
        <span className="text-xs uppercase hidden sm:block tracking-[0.4em] text-neutral-500">
          playing now
        </span>
        <h2 className="md:text-3xl text-xl font-light leading-tight text-white">
          <a
            href={`https://www.youtube.com/watch?v=${track.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {track.title}
          </a>
        </h2>
        <p className="md:text-sm text-xs">
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
  );
}

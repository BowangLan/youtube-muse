import { SpotifyLogo } from "@/components/spotify/spotify-logo";
import type { SpotifyTrackSearchResult } from "@/lib/spotify/api";
import { catalogAuthorNames } from "@/lib/types/catalog-search";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils/youtube";
import { Music2, Play } from "lucide-react";
import { SpotifyResultImage } from "./spotify-result-image";

type SpotifyTrackResultCardProps = {
  result: SpotifyTrackSearchResult;
  index: number;
  currentResultId: string | null;
  isPlaying: boolean;
  onResultClick: (index: number) => void;
};

export function SpotifyTrackResultCard({
  result,
  index,
  currentResultId,
  isPlaying,
  onResultClick,
}: SpotifyTrackResultCardProps) {
  const isCurrent = result.id === currentResultId;

  return (
    <button
      type="button"
      onClick={() => onResultClick(index)}
      className={cn(
        "group flex min-h-20 w-full items-center gap-3 rounded-xl border border-transparent bg-white/[0.035] p-2 text-left transition-colors hover:border-white/10 hover:bg-white/[0.075]",
        isCurrent && "border-[#1DB954]/25 bg-[#1DB954]/[0.07]",
      )}
      aria-label={`Play ${result.title}`}
    >
      <span className="relative size-16 shrink-0 overflow-hidden rounded-lg shadow-lg shadow-black/20">
        <SpotifyResultImage result={result} icon={Music2} className="size-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="size-5 fill-white text-white" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white/90">{result.title}</span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-white/50">
          <SpotifyLogo className="size-3.5 shrink-0 text-[#1DB954]" />
          <span className="truncate">{catalogAuthorNames(result.authors)}</span>
        </span>
        <span className="mt-1 block truncate text-[11px] text-white/35">{result.album.name}</span>
      </span>
      <span className="shrink-0 pr-1 font-mono text-[11px] text-white/35">
        {result.duration ? formatTime(result.duration) : ""}
      </span>
      {isCurrent && <span className="sr-only">{isPlaying ? "Now playing" : "Selected"}</span>}
    </button>
  );
}

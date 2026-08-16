import type { YouTubeSearchVideoResult } from "@/lib/store/search-store";
import { catalogAuthorNames, catalogPrimaryImage } from "@/lib/types/catalog-search";
import { cn } from "@/lib/utils";
import { Play, Tv } from "lucide-react";

type YouTubeResultCardProps = {
  result: YouTubeSearchVideoResult;
  index: number;
  currentResultId: string | null;
  isPlaying: boolean;
  onResultClick: (index: number) => void;
};

export function YouTubeResultCard({
  result,
  index,
  currentResultId,
  isPlaying,
  onResultClick,
}: YouTubeResultCardProps) {
  const isCurrent = result.id === currentResultId;
  const thumbnail = catalogPrimaryImage(result.images) ?? "";

  return (
    <button
      type="button"
      onClick={() => onResultClick(index)}
      className={cn(
        "group flex w-full gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left transition-colors hover:bg-white/10 sm:gap-4 sm:p-3",
        isCurrent && "border-white/30 bg-white/12",
      )}
      aria-label={`Play ${result.title}`}
    >
      <div className="relative w-[42%] max-w-[320px] min-w-[120px] overflow-hidden rounded-lg bg-black/40 sm:min-w-[160px]">
        <img
          src={thumbnail}
          alt={result.title}
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
        {result.durationText && (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[11px] font-medium text-white">
            {result.durationText}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-sm font-medium text-white sm:text-base">{result.title}</p>
        <p className="text-xs text-white/60 sm:text-sm">
          {[result.viewCountText, result.publishedTimeText].filter(Boolean).join(" • ")}
        </p>
        <div className="flex items-center gap-2 text-xs text-white/75 sm:text-sm">
          <span className="flex size-5 items-center justify-center rounded-full bg-white/10">
            <Tv className="size-3" />
          </span>
          <span className="truncate">{catalogAuthorNames(result.authors)}</span>
        </div>
        {isCurrent && (
          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] text-white/85">
            <Play className="size-3" />
            {isPlaying ? "Now playing" : "Selected"}
          </span>
        )}
      </div>
    </button>
  );
}

"use client";

import { useIsPlaying } from "@/hooks/use-is-playing";
import type { YouTubeSearchVideoResult } from "@/lib/store/youtube-search-store";
import { cn } from "@/lib/utils";
import { Loader2, Play, Search, Tv } from "lucide-react";

type YouTubeSearchResultsSectionProps = {
  query: string
  isSearching: boolean
  error: string | null
  results: YouTubeSearchVideoResult[]
  currentVideoId: string | null
  onResultClick: (index: number) => void
}

export function YouTubeSearchResultsSection({
  query,
  isSearching,
  error,
  results,
  currentVideoId,
  onResultClick,
}: YouTubeSearchResultsSectionProps) {
  const isPlaying = useIsPlaying();

  return (
    <section className="h-full min-h-0 overflow-y-auto pb-(--bottom-spacing)">
      <div className="sticky top-0 z-10 mb-4 flex h-12 items-center backdrop-blur">
        <h2 className="h2">Search Results</h2>
      </div>

      {isSearching ? (
        <div className="flex h-[50vh] items-center justify-center text-white/60">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Searching YouTube...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : results.length === 0 ? (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-white/50">
          <Search className="h-8 w-8" />
          <p className="text-sm">
            {query.trim()
              ? `No videos found for "${query.trim()}".`
              : "Search YouTube videos from the toolbar above."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result, index) => {
            const isCurrent = result.videoId === currentVideoId;
            const thumbnail = result.thumbnail.startsWith("//")
              ? `https:${result.thumbnail}`
              : result.thumbnail;

            return (
              <button
                key={result.videoId}
                type="button"
                onClick={() => onResultClick(index)}
                className={cn(
                  "group flex w-full gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left transition-colors hover:bg-white/10 sm:gap-4 sm:p-3",
                  isCurrent && "border-white/30 bg-white/12"
                )}
              >
                <div className="relative w-[42%] max-w-[320px] min-w-[160px] overflow-hidden rounded-lg bg-black/40">
                  <img
                    src={thumbnail}
                    alt={result.title}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                  {result.lengthText && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[11px] font-medium text-white">
                      {result.lengthText}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="line-clamp-2 text-sm font-medium text-white sm:text-base">
                    {result.title}
                  </p>
                  <p className="text-xs text-white/60 sm:text-sm">
                    {[result.viewCount, result.publishedTime]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-white/75 sm:text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                      <Tv className="h-3 w-3" />
                    </span>
                    <span className="truncate">{result.channelTitle}</span>
                  </div>
                  {isCurrent && (
                    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] text-white/85">
                      <Play className="h-3 w-3" />
                      {isPlaying ? "Now playing" : "Selected"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

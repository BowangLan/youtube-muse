"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { PlayUrlDialog } from "@/components/player/play-url-dialog";
import {
  searchYouTubeUnofficial,
  type SearchVideoResult,
} from "@/app/actions/youtube-search-unofficial";
import { useYouTubeSearchStore } from "@/lib/store/youtube-search-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { V4TabsSection } from "./v4-tabs-list";
import { SearchIcon } from "../ui/search";
import { useV4AppStateStore } from "@/lib/store/v4-app-state-store";
import { cn } from "@/lib/utils";

export function V4Header() {
  const query = useYouTubeSearchStore((state) => state.query);
  const isSearchActive = useYouTubeSearchStore((state) => state.isActive);
  const isSearching = useYouTubeSearchStore((state) => state.isSearching);
  const setSearchQuery = useYouTubeSearchStore((state) => state.setQuery);
  const startSearch = useYouTubeSearchStore((state) => state.startSearch);
  const setSearchResults = useYouTubeSearchStore((state) => state.setResults);
  const setSearchError = useYouTubeSearchStore((state) => state.setError);
  const clearSearch = useYouTubeSearchStore((state) => state.clearSearch);
  const openSearch = useV4AppStateStore((state) => state.openSearch);
  const closeSearch = useV4AppStateStore((state) => state.closeSearch);

  const handleSearchSubmit = React.useCallback(async () => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      clearSearch();
      return;
    }

    startSearch(normalizedQuery);
    try {
      const { results, error } = await searchYouTubeUnofficial(
        normalizedQuery,
        "video",
        "any",
      );
      if (error) {
        setSearchError(error);
        return;
      }

      const videoResults = results.filter(
        (result): result is SearchVideoResult => "videoId" in result,
      );
      const filteredResults = videoResults.filter((result) =>
        /^[a-zA-Z0-9_-]{11}$/.test(result.videoId),
      );
      const uniqueResults = Array.from(
        new Map(
          filteredResults.map((result) => [result.videoId, result]),
        ).values(),
      );
      setSearchResults(uniqueResults);
      openSearch();
    } catch (error) {
      console.error("YouTube search failed:", error);
      setSearchError("Failed to search videos. Please try again.");
      openSearch();
    }
  }, [query, clearSearch, openSearch, setSearchError, setSearchResults, startSearch]);

  return (
    <div className="space-y-1.5 text-left motion-opacity-in-0 motion-blur-in-lg sm:space-y-2 px-page h-20 border-b border-white/10 flex items-center sticky top-0 bg-background/0 backdrop-blur-xl z-10">
      <div className="flex flex-row items-center gap-3 flex-1 min-w-0 relative">
        {/* Site name */}
        <h1 className="text-base leading-none md:text-lg">
          YouTube Muse
        </h1>
        {/* <span className="text-xs text-neutral-500">curate & play & focus</span> */}

        <V4TabsSection className="mx-8 flex-none" />

        <div className="flex justify-end items-center gap-3 ml-auto">
          <form
            className={cn(
              "flex w-fit items-center gap-2 trans",
              isSearchActive && "absolute left-1/2 -translate-x-1/2",
            )}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSearchSubmit();
            }}
          >
            <div
              className={cn(
                "relative flex-none w-[20rem] focus-within:w-[calc(20rem+1rem)] trans group"
              )}
            >
              <SearchIcon
                size={16}
                animate={isSearching}
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50"
              />
              <Input
                value={query}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search YouTube videos..."
                className="h-10 rounded-xl focus-visible:ring-0 border-white/10 dark:border-white/10 dark:focus-visible:bg-white/10 bg-white/5 dark:bg-white/5 pl-9 pr-10 text-foreground placeholder:text-foreground/35 dark:placeholder:text-foreground/35"
              />
              {/* {isSearching ? (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/45" />
              ) : null} */}
            </div>
            {isSearchActive ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => { clearSearch(); closeSearch(); }}
                className="h-10 rounded-xl border-white/15 bg-white/5 px-3 text-foreground hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </form>

          <PlayUrlDialog />
        </div>
      </div>
    </div>
  );
}

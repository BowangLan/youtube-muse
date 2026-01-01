"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Plus, UserPlus } from "lucide-react";
import {
  searchYouTubeChannels,
  type ChannelSearchResult,
} from "@/app/actions/youtube-channels";
import { cn } from "@/lib/utils";
import type { Channel } from "@/lib/types/stream";

interface AddChannelPopoverProps {
  streamId: string;
  existingChannels: Channel[];
  onAddChannel: (channel: Omit<Channel, "id">) => void;
}

export function AddChannelPopover({
  streamId,
  existingChannels,
  onAddChannel,
}: AddChannelPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [channelQuery, setChannelQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<
    ChannelSearchResult[]
  >([]);
  const [error, setError] = React.useState<string | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('youtube-api-search-channels', { context: 'add-channel-popover', query: query.substring(0, 50) });
      }
      const { results, error: searchError } = await searchYouTubeChannels(
        query
      );

      if (searchError) {
        setError(searchError);
        setSearchResults([]);
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search channels. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputSubmit = async () => {
    const query = channelQuery.trim();
    if (!query) return;

    await handleSearch(query);
  };

  const handleAddChannel = async (result: ChannelSearchResult) => {
    // Check if channel is already in the stream
    const isAlreadyInStream = existingChannels.some(
      (channel) => channel.id === result.id
    );

    if (isAlreadyInStream) {
      setError("This channel is already in the stream");
      return;
    }

    // Convert ChannelSearchResult to Channel format
    const channel: Omit<Channel, "id"> = {
      title: result.title,
      thumbnailUrl: result.thumbnail.thumbnails[0]?.url || "",
      customUrl: result.customUrl,
    };

    onAddChannel(channel);
    setIsOpen(false);
    setChannelQuery("");
    setSearchResults([]);
    setError(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
      setChannelQuery("");
      setSearchResults([]);
      setError(null);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full border border-white/10 bg-white/5 p-0 text-white/70 hover:bg-white/10 hover:text-white"
          title="Add more channels"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-xl border border-white/10 bg-[#050505] p-0 text-white"
        side="bottom"
        align="start"
      >
        <div className="space-y-4 p-4">
          {/* <div className="space-y-2">
            <h4 className="text-sm font-medium">Add Channel</h4>
            <p className="text-xs text-white/60">
              Search for a YouTube channel to add to this stream.
            </p>
          </div> */}

          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Search channels..."
                value={channelQuery}
                onChange={(e) => {
                  setChannelQuery(e.target.value);
                  setError(null);
                  // Clear search results when input changes
                  if (searchResults.length > 0) {
                    setSearchResults([]);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSearching) {
                    handleInputSubmit();
                  }
                }}
                className="h-9 rounded-lg border-white/10 bg-white/5 pr-10 text-white placeholder:text-zinc-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
                </div>
              )}
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {searchResults.map((result) => {
                const thumbnail = result.thumbnail.thumbnails[0];
                const isInStream = existingChannels.some(
                  (channel) => channel.id === result.id
                );

                return (
                  <button
                    key={result.id}
                    onClick={() => handleAddChannel(result)}
                    disabled={isInStream}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                      isInStream
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-white/10"
                    )}
                  >
                    <img
                      src={thumbnail?.url}
                      alt={result.title}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {result.title}
                      </p>
                      {result.subscriberCount && (
                        <p className="text-xs text-zinc-400">
                          {result.subscriberCount}
                        </p>
                      )}
                    </div>
                    {isInStream && (
                      <div className="text-xs text-zinc-500">Added</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* {searchResults.length === 0 &&
            channelQuery.trim() &&
            !isSearching && (
              <div className="flex justify-center py-4">
                <Button
                  onClick={handleInputSubmit}
                  disabled={!channelQuery.trim() || isSearching}
                  size="sm"
                  className="rounded-full bg-white text-black hover:bg-white/90"
                >
                  Search
                </Button>
              </div>
            )} */}
        </div>
      </PopoverContent>
    </Popover>
  );
}

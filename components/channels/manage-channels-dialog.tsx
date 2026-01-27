"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, X } from "lucide-react";
import {
  searchYouTubeChannels,
  type SearchChannelResult,
} from "@/app/actions/youtube-search-unofficial";
import { cn } from "@/lib/utils";
import { useChannelsStore } from "@/lib/store/channels-store";

interface ManageChannelsDialogProps {
  trigger?: React.ReactNode;
}

export function ManageChannelsDialog({ trigger }: ManageChannelsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [channelQuery, setChannelQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<
    SearchChannelResult[]
  >([]);
  const [error, setError] = React.useState<string | null>(null);

  const channels = useChannelsStore((state) => state.channels);
  const addChannel = useChannelsStore((state) => state.addChannel);
  const removeChannel = useChannelsStore((state) => state.removeChannel);

  const existingChannelIds = React.useMemo(
    () => channels.map((c) => c.id),
    [channels]
  );

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("youtube-api-search-channels", {
          context: "manage-channels-dialog",
          query: query.substring(0, 50),
        });
      }
      const { results, error: searchError } = await searchYouTubeChannels(query);

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

  const handleAddChannel = async (result: SearchChannelResult) => {
    const isAlreadyAdded = existingChannelIds.includes(result.channelId);

    if (isAlreadyAdded) {
      setError("This channel is already added");
      return;
    }

    addChannel({
      id: result.channelId,
      title: result.title,
      thumbnailUrl: result.thumbnail || "",
      customUrl: result.customUrl || undefined,
    });
    setChannelQuery("");
    setSearchResults([]);
    setError(null);
  };

  const resetForm = () => {
    setChannelQuery("");
    setSearchResults([]);
    setError(null);
    setIsSearching(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 100);
  };

  const defaultTrigger = (
    <Button variant="outline" className="rounded-full">
      Manage Channels
    </Button>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        } else {
          setIsOpen(true);
        }
      }}
    >
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="w-[92vw] max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#070707] p-0 text-white motion-preset-slide-up-sm sm:max-w-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_40%)]"
        />
        <div className="relative flex max-h-[85vh] flex-col gap-6 overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">
              Manage channels.
            </DialogTitle>
            <DialogDescription>
              Add or remove channels to shape your latest videos feed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/70">
                Current channels
              </h3>
              <span className="text-xs text-white/40">
                {channels.length} total
              </span>
            </div>
            <div className="space-y-2">
              {channels.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/40">
                  No channels added yet.
                </div>
              ) : (
                channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <img
                      src={channel.thumbnailUrl}
                      alt={channel.title}
                      loading="lazy"
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {channel.title}
                      </p>
                      {channel.customUrl && (
                        <p className="truncate text-xs text-white/40">
                          {channel.customUrl}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChannel(channel.id)}
                      className="h-8 w-8 rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                      aria-label={`Remove ${channel.title}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/70">Find channels</h3>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="Search channels..."
                  value={channelQuery}
                  onChange={(e) => {
                    setChannelQuery(e.target.value);
                    setError(null);
                    if (searchResults.length > 0) {
                      setSearchResults([]);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSearching) {
                      handleInputSubmit();
                    }
                  }}
                  className="h-10 rounded-xl border-white/10 bg-white/5 pr-10 text-white placeholder:text-zinc-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  </div>
                )}
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {searchResults.map((result) => {
                  const isAdded = existingChannelIds.includes(result.channelId);

                  return (
                    <button
                      key={result.channelId}
                      onClick={() => handleAddChannel(result)}
                      disabled={isAdded}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 text-left transition-colors",
                        isAdded
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-white/10"
                      )}
                    >
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="h-10 w-10 rounded-full object-cover"
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/70">
                        <Plus className="h-4 w-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {searchResults.length === 0 && !isSearching && channelQuery && (
              <p className="text-center text-sm text-zinc-500">
                Press Enter to search
              </p>
            )}
          </div>

          <div className="flex items-center justify-end pt-1">
            <Button variant="ghost" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

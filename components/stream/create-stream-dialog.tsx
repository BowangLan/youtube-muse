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
import { Loader2, Plus, Radio, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useStreamsStore } from "@/lib/store/streams-store";
import type { Channel } from "@/lib/types/stream";
import {
  searchYouTubeChannels,
  getChannelById,
  type ChannelSearchResult,
} from "@/app/actions/youtube-channels-official";
import { extractChannelId, isChannelUrl } from "@/lib/utils/youtube";

interface CreateStreamDialogProps {
  trigger?: React.ReactNode;
  onCreated?: (streamId: string) => void;
}

export function CreateStreamDialog({
  trigger,
  onCreated,
}: CreateStreamDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const [channelInput, setChannelInput] = React.useState("");
  const [trackLimit, setTrackLimit] = React.useState(10);
  const [searchResults, setSearchResults] = React.useState<
    ChannelSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = React.useState<string>("");
  const [nameOverwritten, setNameOverwritten] = React.useState(false);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const lastSearchTimeRef = React.useRef<number>(0);
  const searchAbortControllerRef = React.useRef<AbortController | null>(null);

  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist
  );
  const createStream = useStreamsStore((state) => state.createStream);

  // Auto-generate name from channel titles
  const generateNameFromChannels = React.useCallback(
    (channelList: Channel[]): string => {
      if (channelList.length === 0) return "";

      // Take first 2-3 channel titles and join with " & "
      const count = Math.min(channelList.length, 3);
      return channelList
        .slice(0, count)
        .map((c) => c.title)
        .join(" & ");
    },
    []
  );

  // Auto-generate name when channels change and name hasn't been manually edited
  React.useEffect(() => {
    if (channels.length > 0 && (!nameOverwritten || !name.trim())) {
      setName(generateNameFromChannels(channels));
    }
  }, [channels, nameOverwritten, generateNameFromChannels, name]);

  // Debounced and throttled channel search
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (channelInput.trim() && !isChannelUrl(channelInput)) {
        const now = Date.now();
        const timeSinceLastSearch = now - lastSearchTimeRef.current;
        const throttleDelay = 500; // Minimum 500ms between searches

        // If we searched recently, wait a bit longer
        if (timeSinceLastSearch < throttleDelay) {
          const additionalDelay = throttleDelay - timeSinceLastSearch;
          await new Promise((resolve) => setTimeout(resolve, additionalDelay));
        }

        // Create new abort controller for this search
        const abortController = new AbortController();
        searchAbortControllerRef.current = abortController;

        setIsSearching(true);
        lastSearchTimeRef.current = Date.now();

        try {
          if (typeof window !== "undefined" && window.umami && process.env.NODE_ENV === "production") {
            window.umami.track("youtube-api-search-channels", {
              context: "create-stream-dialog",
              query: channelInput.substring(0, 50),
            });
          }
          const { results } = await searchYouTubeChannels(channelInput);

          // Only update if this search wasn't aborted
          if (!abortController.signal.aborted) {
            setSearchResults(results);
            setShowSearchResults(true);
            setIsSearching(false);
          }
        } catch (err) {
          if (!abortController.signal.aborted) {
            console.error("Channel search error:", err);
            setIsSearching(false);
          }
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      // Cancel ongoing search when input changes
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
        searchAbortControllerRef.current = null;
      }
      setIsSearching(false);
    };
  }, [channelInput]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setChannels([]);
    setChannelInput("");
    setTrackLimit(10);
    setSearchResults([]);
    setError(null);
    setLoadingStatus("");
    setNameOverwritten(false);
    setShowSearchResults(false);
    lastSearchTimeRef.current = 0;
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
      searchAbortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 100);
  };

  const handleAddChannel = async (channel: ChannelSearchResult) => {
    // Check for duplicates
    if (channels.some((c) => c.id === channel.id)) {
      setError("This channel is already added");
      return;
    }

    const newChannel: Channel = {
      id: channel.id,
      title: channel.title,
      thumbnailUrl: channel.thumbnail?.thumbnails?.[0]?.url || "",
      customUrl: channel.customUrl,
    };

    setChannels((prev) => [...prev, newChannel]);
    setChannelInput("");
    setSearchResults([]);
    setShowSearchResults(false);
    setError(null);
  };

  const handleChannelInputBlur = async () => {
    // If input is a URL or ID, try to add it
    if (channelInput.trim() && isChannelUrl(channelInput)) {
      const channelId = extractChannelId(channelInput);
      if (channelId) {
        setIsSearching(true);
        try {
          if (typeof window !== "undefined" && window.umami && process.env.NODE_ENV === "production") {
            window.umami.track("youtube-api-get-channel", {
              context: "create-stream-dialog",
            });
          }
          const { channel, error: fetchError } =
            await getChannelById(channelId);
          if (channel) {
            handleAddChannel(channel);
          } else {
            setError(fetchError || "Channel not found");
          }
        } catch {
          setError("Failed to fetch channel");
        } finally {
          setIsSearching(false);
        }
      }
    }
  };

  const handleRemoveChannel = (channelId: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a stream name");
      return;
    }

    if (channels.length === 0) {
      setError("Please add at least one channel");
      return;
    }

    if (trackLimit < 1 || trackLimit > 50) {
      setError("Track limit must be between 1 and 50");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setLoadingStatus("Creating playlist...");

      // Create the playlist first
      createPlaylist(trimmedName, description.trim() || undefined, []);

      // Get the newly created playlist ID
      const state = usePlaylistStore.getState();
      const newPlaylist = state.playlists.find((p) => p.name === trimmedName);

      if (!newPlaylist) {
        setError("Failed to create playlist");
        setIsLoading(false);
        return;
      }

      setLoadingStatus("Creating stream...");

      // Create the stream
      const newStream = createStream({
        name: trimmedName,
        description: description.trim() || undefined,
        channels: channels,
        trackLimit: trackLimit,
        playlistId: newPlaylist.id,
      });

      setLoadingStatus("Fetching latest videos from channels...");

      // Once the stream is created, the videos will be fetched in the new StreamDataLoader

      // Set as current playlist
      setCurrentPlaylist(newPlaylist.id);

      // Notify parent if callback provided
      onCreated?.(newStream.id);

      handleClose();
    } catch (err) {
      console.error("Error creating stream:", err);
      setError("Failed to create stream. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const defaultTrigger = (
    <button
      type="button"
      className={cn(
        "relative group w-full flex min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl",
        "border-2 border-dashed border-white/10 bg-white/[0.02]",
        "transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]",
        "text-white/40 hover:text-white/60"
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="text-xs font-medium tracking-wide">Create Stream</span>
    </button>
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
      <DialogContent className="w-full h-full sm:max-w-4xl rounded-2xl border border-white/10 bg-[#050505] p-0 text-white motion-preset-slide-up-sm max-h-[90vh] overflow-hidden">
        <div className="space-y-3 p-4 sm:space-y-4 sm:p-6 overflow-y-auto max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
              <Radio className="h-4 w-4 shrink-0 text-purple-400 sm:h-5 sm:w-5" />
              Create Channel Stream
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 sm:text-sm">
              Subscribe to YouTube channels and automatically get their latest
              music videos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 flex-1">
            {/* Channel Input */}
            <div className="space-y-1.5 sm:space-y-2">
              <div>
                <label className="text-xs font-medium text-white/70 sm:text-sm">
                  Channels
                </label>
              </div>
              <div className="relative">
                <Input
                  placeholder="Paste channel URL or search by name..."
                  value={channelInput}
                  onChange={(e) => {
                    setChannelInput(e.target.value);
                    setError(null);
                  }}
                  onBlur={handleChannelInputBlur}
                  className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 sm:h-11 sm:text-base"
                  disabled={isLoading}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white/40" />
                )}

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-[#0a0a0a] shadow-lg overflow-hidden max-h-[400px] overflow-y-auto">
                    {searchResults.slice(0, 15).map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleAddChannel(result)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                      >
                        {result.thumbnail?.thumbnails?.[0]?.url && (
                          <img
                            src={result.thumbnail.thumbnails[0].url}
                            alt={result.title}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {result.title}
                          </div>
                          {result.subscriberCount && (
                            <div className="text-xs text-white/50">
                              {result.subscriberCount}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Channels */}
              {channels.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center gap-2 rounded-full bg-white/10 pl-1 pr-3 py-1"
                    >
                      {channel.thumbnailUrl && (
                        <img
                          src={channel.thumbnailUrl}
                          alt={channel.title}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      <span className="text-xs text-white">
                        {channel.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChannel(channel.id)}
                        className="text-white/50 hover:text-white/80 transition-colors"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-zinc-500 sm:text-xs">
                Add channels by pasting URLs or searching by name.
              </p>
            </div>

            {/* Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <div>
                <label
                  htmlFor="stream-name"
                  className="text-xs font-medium text-white/70 sm:text-sm"
                >
                  Name
                </label>
              </div>
              <Input
                id="stream-name"
                placeholder="e.g., LoFi Girl & ChillHop Music"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameOverwritten(true);
                  setError(null);
                }}
                className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 sm:h-11 sm:max-w-sm sm:text-base"
                disabled={isLoading}
              />
            </div>

            {/* Track Limit */}
            <div className="space-y-1.5 sm:space-y-2">
              <div>
                <label
                  htmlFor="track-limit"
                  className="text-xs font-medium text-white/70 sm:text-sm"
                >
                  Max tracks per stream
                </label>
              </div>
              <Input
                id="track-limit"
                type="number"
                min="1"
                max="50"
                value={trackLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setTrackLimit(val);
                    setError(null);
                  }
                }}
                className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 sm:h-11 sm:max-w-[200px] sm:text-base"
                disabled={isLoading}
              />
              <p className="text-[11px] text-zinc-500 sm:text-xs">
                Total number of tracks to keep from all channels (1-50).
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:space-y-2 hidden sm:block">
              <div>
                <label
                  htmlFor="stream-description"
                  className="text-xs font-medium text-white/70 sm:text-sm"
                >
                  Description <span className="text-zinc-500">(optional)</span>
                </label>
              </div>
              <Input
                id="stream-description"
                placeholder="e.g., Best channels for study music"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 sm:h-11 sm:text-base"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 sm:text-sm">{error}</p>
            )}

            {loadingStatus && (
              <p className="flex items-center gap-2 text-xs text-zinc-400 sm:text-sm">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                {loadingStatus}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="h-10 w-full rounded-full px-4 text-white hover:bg-white/10 sm:h-auto sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || channels.length === 0 || isLoading}
              className="h-10 w-full rounded-full bg-white text-black hover:bg-white/90 sm:h-auto sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Stream
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

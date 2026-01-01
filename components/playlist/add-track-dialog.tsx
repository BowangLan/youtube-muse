"use client";

import * as React from "react";
import type { Playlist, Track } from "@/lib/types/playlist";
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
import { Loader2, Plus } from "lucide-react";
import { extractVideoId, isYouTubeShort } from "@/lib/utils/youtube";
import { cn } from "@/lib/utils";
import { RichButton } from "../ui/rich-button";
import {
  searchYouTubeVideos,
  type SearchResult,
} from "@/app/actions/youtube-search";

interface AddTrackDialogContentProps {
  playlist: Playlist | null;
  currentPlaylistId: string | null;
  onAddTrack: (playlistId: string, track: Omit<Track, "addedAt">) => void;
  onClose: () => void;
}

type YouTubeVideoMetadata = {
  title: string;
  author_name: string;
  author_url: string;
  type: string;
  height: number;
  width: number;
  version: string;
  provider_name: string;
  provider_url: string;
  thumbnail_height: number;
  thumbnail_width: number;
  thumbnail_url: string;
  html: string;
};


async function fetchVideoMetadata(
  videoId: string
): Promise<Omit<Track, "addedAt"> | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch video metadata");
    }

    const data: YouTubeVideoMetadata = await response.json();

    console.log("Video metadata:", data);

    return {
      id: videoId,
      title: data.title,
      author: data.author_name,
      authorUrl: data.author_url,
      duration: 0,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (error) {
    console.error("Error fetching video metadata:", error);
    return null;
  }
}

export function AddTrackDialogContent({
  playlist,
  currentPlaylistId,
  onAddTrack,
  onClose,
}: AddTrackDialogContentProps) {
  const [videoUrl, setVideoUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const normalizedInput = videoUrl.trim();
  const inputVideoId = normalizedInput ? extractVideoId(normalizedInput) : null;
  const isDuplicate = !!(
    inputVideoId && playlist?.tracks.some((track) => track.id === inputVideoId)
  );

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('youtube-api-search-videos', { context: 'add-track-dialog', query: query.substring(0, 50) });
      }
      const { results, error: searchError } = await searchYouTubeVideos(query);

      if (searchError) {
        setError(searchError);
        setSearchResults([]);
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search videos. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = async (urlOverride?: string) => {
    const targetUrl = (urlOverride ?? videoUrl).trim();

    if (!targetUrl || !currentPlaylistId) {
      setError("Please enter a video URL or ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Check if it's a YouTube Short
    if (isYouTubeShort(targetUrl)) {
      setError("YouTube Shorts are not supported. Please add regular YouTube videos.");
      setIsLoading(false);
      return;
    }

    const videoId = extractVideoId(targetUrl);
    if (!videoId) {
      setError("Invalid YouTube URL or video ID");
      setIsLoading(false);
      return;
    }

    const isAlreadyInPlaylist = playlist?.tracks.some(
      (track) => track.id === videoId
    );

    if (isAlreadyInPlaylist) {
      setError("This track is already in the playlist");
      setIsLoading(false);
      return;
    }

    const track = await fetchVideoMetadata(videoId);
    if (!track) {
      setError("Failed to fetch video information. Please check the URL.");
      setIsLoading(false);
      return;
    }

    onAddTrack(currentPlaylistId, track);
    setVideoUrl("");
    setSearchResults([]);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleInputSubmit = async () => {
    const input = videoUrl.trim();
    if (!input) return;

    // Check if input is a valid YouTube URL
    const videoId = extractVideoId(input);
    if (videoId) {
      // It's a valid URL, add the track directly
      await handleAddTrack();
    } else {
      // It's a search query, perform search
      await handleSearch(input);
    }
  };

  const handleSearchResultClick = async (result: SearchResult) => {
    if (!currentPlaylistId) return;

    const isAlreadyInPlaylist = playlist?.tracks.some(
      (track) => track.id === result.id
    );

    if (isAlreadyInPlaylist) {
      setError("This track is already in the playlist");
      return;
    }

    setIsLoading(true);
    setError(null);

    const track = await fetchVideoMetadata(result.id);
    if (!track) {
      setError("Failed to fetch video information.");
      setIsLoading(false);
      return;
    }

    onAddTrack(currentPlaylistId, track);
    setVideoUrl("");
    setSearchResults([]);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="space-y-4 p-6">
      <DialogHeader className="space-y-1 text-left">
        <DialogTitle className="text-xl font-semibold">
          Add a track
        </DialogTitle>
        <DialogDescription className="text-sm text-zinc-500">
          Paste a YouTube link or search for a video.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <div className="relative">
          <Input
            id="video-url-input"
            placeholder="https://youtu.be/... or search"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setError(null);
              // Clear search results when input changes
              if (searchResults.length > 0) {
                setSearchResults([]);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading && !isSearching) {
                handleInputSubmit();
              }
            }}
            className="h-11 rounded-xl border-white/10 bg-white/5 pr-10 text-white placeholder:text-zinc-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          )}
        </div>
        {isDuplicate && (
          <p className="text-sm text-destructive">
            This track is already in the playlist.
          </p>
        )}
        {error && !isDuplicate && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2">
          {searchResults.map((result) => {
            const thumbnail =
              result.thumbnail.thumbnails[result.thumbnail.thumbnails.length - 1];
            const isInPlaylist = playlist?.tracks.some(
              (track) => track.id === result.id
            );

            return (
              <button
                key={result.id}
                onClick={() => handleSearchResultClick(result)}
                disabled={isInPlaylist || isLoading}
                className={cn(
                  "flex w-full gap-3 rounded-lg p-2 text-left transition-colors",
                  isInPlaylist
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-white/10"
                )}
              >
                <img
                  src={thumbnail.url}
                  alt={result.title}
                  className="h-16 w-28 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="line-clamp-2 text-sm font-medium text-white">
                    {result.title}
                  </p>
                  <p className="text-xs text-zinc-400">{result.channelTitle}</p>
                  {result.length && (
                    <p className="text-xs text-zinc-500">
                      {result.length.simpleText}
                    </p>
                  )}
                </div>
                {isInPlaylist && (
                  <div className="flex items-center text-xs text-zinc-500">
                    Added
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {searchResults.length === 0 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full px-4 text-white hover:bg-background"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleInputSubmit()}
            disabled={!videoUrl.trim() || isLoading || isDuplicate || isSearching}
            className="rounded-full bg-white text-black hover:bg-white/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {inputVideoId ? "Add Track" : "Search"}
          </Button>
        </div>
      )}
    </div>
  );
}

interface AddTrackDialogProps {
  playlist: Playlist | null;
  currentPlaylistId: string | null;
  onAddTrack: (playlistId: string, track: Omit<Track, "addedAt">) => void;
  trigger?: React.ReactNode;
  triggerClassName?: string;
}

export function AddTrackDialog({
  playlist,
  currentPlaylistId,
  onAddTrack,
  trigger,
  triggerClassName,
}: AddTrackDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dialogKey, setDialogKey] = React.useState(0);

  const handleClose = () => {
    setIsOpen(false);
    // Reset form state by remounting the content component
    setTimeout(() => {
      setDialogKey((prev) => prev + 1);
    }, 100);
  };

  const defaultTrigger = (
    <RichButton
      tooltip="Add a track to the playlist"
      variant="ghost"
      size="sm"
      disabled={!currentPlaylistId}
      className={cn("rounded-full", triggerClassName)}
    >
      <Plus className="h-4 w-4" />
    </RichButton>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        } else {
          setIsOpen(true);
          setDialogKey((prev) => prev + 1);
        }
      }}
    >
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="max-w-lg rounded-2xl border border-white/10 bg-[#050505] p-0 text-white motion-preset-slide-up-sm">
        <AddTrackDialogContent
          key={dialogKey}
          playlist={playlist}
          currentPlaylistId={currentPlaylistId}
          onAddTrack={onAddTrack}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}

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
import { extractVideoId } from "@/lib/utils/youtube";
import { cn } from "@/lib/utils";
import { RichButton } from "../ui/rich-button";

interface AddTrackDialogProps {
  playlist: Playlist | null;
  currentPlaylistId: string | null;
  onAddTrack: (playlistId: string, track: Omit<Track, "addedAt">) => void;
  triggerClassName?: string;
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

export function AddTrackDialog({
  playlist,
  currentPlaylistId,
  onAddTrack,
  triggerClassName,
}: AddTrackDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const normalizedInput = videoUrl.trim();
  const inputVideoId = normalizedInput ? extractVideoId(normalizedInput) : null;
  const isDuplicate = !!(
    inputVideoId && playlist?.tracks.some((track) => track.id === inputVideoId)
  );

  const handleAddTrack = async (urlOverride?: string) => {
    const targetUrl = (urlOverride ?? videoUrl).trim();

    if (!targetUrl || !currentPlaylistId) {
      setError("Please enter a video URL or ID");
      return;
    }

    setIsLoading(true);
    setError(null);

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
    setError(null);
    setIsLoading(false);
    setIsOpen(false);
  };

  // React.useEffect(() => {
  //   if (!isOpen && typeof window !== "undefined" && navigator.clipboard) {
  //     // On dialog open, check clipboard for YouTube URL
  //     navigator.clipboard
  //       .readText()
  //       .then((clipText) => {
  //         // Basic YouTube URL regex
  //         const ytPattern =
  //           /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  //         if (ytPattern.test(clipText)) {
  //           setVideoUrl(clipText.trim());
  //           setIsOpen(true);
  //         }
  //       })
  //       .catch(() => {});
  //   }
  // }, [isOpen, setIsOpen, setVideoUrl]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsOpen(false);
          setTimeout(() => {
            setVideoUrl("");
            setError(null);
            setIsLoading(false);
          }, 100);
        } else {
          setIsOpen(true);
        }
      }}
    >
      <DialogTrigger asChild>
        <RichButton
          tooltip="Add a track to the playlist"
          variant="ghost"
          size="sm"
          disabled={!currentPlaylistId}
          className={cn(
            "rounded-full",
            // "gap-2 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white",
            triggerClassName
          )}
        >
          <Plus className="h-4 w-4" />
        </RichButton>
      </DialogTrigger>
      <DialogContent className="max-w-lg overflow-hidden border border-white/10 bg-gradient-to-br from-[#0b0d12] via-[#0a0c12] to-[#06070d] p-0 shadow-[0_24px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_75%_0%,rgba(99,102,241,0.08),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.06),transparent_40%)]" />
          <div className="absolute -left-16 -top-24 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative space-y-6 p-6 sm:p-7">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-white">
              Add a track
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60">
              Paste a YouTube link or ID. Press Enter or click Add.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              id="video-url-input"
              placeholder="https://youtu.be/... or video ID"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleAddTrack();
                }
              }}
              className="h-12 rounded-xl border-white/20 bg-black/50 text-white placeholder:text-white/40 shadow-[0_20px_80px_-60px_rgba(0,0,0,1)] backdrop-blur-xl focus-visible:border-white/60 focus-visible:ring-white/20"
            />
            {isDuplicate && (
              <p className="text-sm text-destructive">
                This track is already in the playlist.
              </p>
            )}
            {error && !isDuplicate && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-background"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleAddTrack()}
              disabled={!videoUrl.trim() || isLoading || isDuplicate}
              className="rounded-full bg-white text-black hover:bg-white/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Track
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

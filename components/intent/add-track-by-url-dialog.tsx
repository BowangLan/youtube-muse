"use client";

import * as React from "react";
import type { Track } from "@/lib/types/playlist";
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
import { Label } from "@/components/ui/label";
import { Loader2, Link2 } from "lucide-react";
import { extractVideoIdFromUrl, getThumbnailUrl } from "@/lib/utils/youtube";
import { getYouTubeVideoDetailUnofficial } from "@/app/actions/youtube-video-detail-unofficial";

interface AddTrackByUrlDialogProps {
  playlistId: string;
  currentTracks: Track[];
  onTrackAdd: (track: Track) => void;
  trigger?: React.ReactNode;
}

export function AddTrackByUrlDialog({
  playlistId: _playlistId,
  currentTracks,
  onTrackAdd,
  trigger,
}: AddTrackByUrlDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const normalizedInput = videoUrl.trim();
  const inputVideoId = normalizedInput
    ? extractVideoIdFromUrl(normalizedInput)
    : null;

  // Check if video already exists in the playlist
  const isDuplicate = React.useMemo(() => {
    if (!inputVideoId) return false;
    return currentTracks.some((track) => track.id === inputVideoId);
  }, [inputVideoId, currentTracks]);

  const resetForm = () => {
    setVideoUrl("");
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 100);
  };

  const handleAdd = async () => {
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      setError("Paste a YouTube video URL");
      return;
    }

    const videoId = extractVideoIdFromUrl(trimmed);
    if (!videoId) {
      setError("Enter a valid YouTube video URL");
      return;
    }

    if (isDuplicate) {
      setError("This video is already in the playlist");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { result, error: fetchError } =
        await getYouTubeVideoDetailUnofficial(trimmed);

      if (fetchError || !result) {
        setError(fetchError || "Failed to load video details. Check the URL.");
        setIsLoading(false);
        return;
      }

      // Convert the video detail result to a Track
      const track: Track = {
        id: result.videoId,
        title: result.title,
        author: result.channel.title,
        authorUrl: result.channel.url,
        authorThumbnail: result.channel.thumbnail || undefined,
        duration: result.durationSeconds,
        thumbnailUrl:
          result.thumbnail || getThumbnailUrl(result.videoId, "hqdefault"),
        addedAt: Date.now(),
        publishedAt: result.publishTime
          ? new Date(result.publishTime).toISOString()
          : undefined,
        publishedTimeText: result.publishTime
          ? new Date(result.publishTime).toLocaleDateString()
          : undefined,
      };

      onTrackAdd(track);
      handleClose();
    } catch (error) {
      console.error("Error adding track by URL:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon">
      <Link2 className="h-4 w-4" />
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
      <DialogContent className="w-[92vw] max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#070707] p-0 text-white motion-preset-slide-up-sm sm:max-w-md">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_40%)]"
        />
        <div className="relative flex flex-col gap-6 overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">
              Add track by URL.
            </DialogTitle>
            <DialogDescription>
              Paste a YouTube video URL to add it to this intent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>YouTube URL</Label>
            <Input
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !isLoading &&
                  inputVideoId &&
                  !isDuplicate
                ) {
                  handleAdd();
                }
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="h-10 w-full rounded-none border-x-0 border-b border-t-0 border-white/20 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {!error && isDuplicate && inputVideoId && (
            <p className="text-sm text-amber-400/90">
              This video is already in the playlist
            </p>
          )}

          {!error && !isDuplicate && normalizedInput && !inputVideoId && (
            <p className="text-sm text-white/50">
              Enter a valid YouTube video URL
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!inputVideoId || isLoading || isDuplicate}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Track
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
